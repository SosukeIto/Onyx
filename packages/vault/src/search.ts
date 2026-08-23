import { plainText, plainTextBody } from "./text";
import type { Note, SearchHit, VaultIndex } from "./types";

export interface SearchOptions {
  limit?: number;
  /** Restrict to notes under this folder (vault-relative). */
  folder?: string;
  tag?: string;
}

const DEFAULT_LIMIT = 50;
const CONTEXT = 40;
const MAX_SNIPPETS = 3;

/**
 * A searchable string plus everything needed to map a match back onto it.
 *
 * @internal Shared with the static bundle's client-side search
 * (`./static/client-search`); not part of the stable package API.
 */
export interface Haystack {
  /** Plain text (markup already removed); snippet offsets refer to it. */
  text: string;
  /** NFKC + lower-cased text used for matching. */
  norm: string;
  /** `map[i]` is the offset in `text` of `norm[i]`; `null` when identical. */
  map: number[] | null;
}

/** @internal */
export interface Haystacks {
  title: Haystack;
  body: Haystack;
}

const cache = new WeakMap<VaultIndex, Map<string, Haystacks>>();

/** NFKC + case folding; the canonical normalization used for matching. */
export function normalizeForSearch(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

function flatten(value: string): string {
  return value.replace(/[\r\n\t]/g, " ");
}

/**
 * Build the match/offset pair for one already-plain string.
 *
 * @internal Shared with `./static/client-search`.
 */
export function makeHaystack(source: string): Haystack {
  const text = flatten(source);
  const norm = normalizeForSearch(text);
  if (norm.length === text.length) return { text, norm, map: null };

  // NFKC changed the length, so build a per-character offset map to keep
  // snippet ranges pointing at the original text.
  const map: number[] = [];
  let built = "";
  for (let i = 0; i < text.length;) {
    const code = text.codePointAt(i) ?? 0;
    const char = String.fromCodePoint(code);
    const piece = normalizeForSearch(char);
    for (let k = 0; k < piece.length; k++) map.push(i);
    built += piece;
    i += char.length;
  }
  map.push(text.length);
  return { text, norm: built, map };
}

function toOriginal(haystack: Haystack, offset: number): number {
  if (!haystack.map) return offset;
  return haystack.map[Math.min(offset, haystack.map.length - 1)] ?? offset;
}

function haystacksFor(index: VaultIndex, note: Note): Haystacks {
  let perIndex = cache.get(index);
  if (!perIndex) {
    perIndex = new Map();
    cache.set(index, perIndex);
  }
  const existing = perIndex.get(note.path);
  if (existing) return existing;
  const value: Haystacks = {
    title: makeHaystack(plainText(note.title)),
    body: makeHaystack(plainTextBody(note.body)),
  };
  perIndex.set(note.path, value);
  return value;
}

function isLowSurrogate(text: string, offset: number): boolean {
  const code = text.charCodeAt(offset);
  if (Number.isNaN(code) || code < 0xdc00 || code > 0xdfff) return false;
  const previous = text.charCodeAt(offset - 1);
  return previous >= 0xd800 && previous <= 0xdbff;
}

/**
 * Keep snippet boundaries off the middle of a surrogate pair, otherwise a
 * slice can end on half an emoji and the client renders a replacement char.
 */
function alignToCodePoint(text: string, offset: number, direction: -1 | 1): number {
  if (offset <= 0 || offset >= text.length) return offset;
  return isLowSurrogate(text, offset) ? offset + direction : offset;
}

function findAll(haystack: string, needle: string): number[] {
  const out: number[] = [];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return out;
    out.push(at);
    from = at + needle.length;
  }
}

function buildSnippets(
  haystack: Haystack,
  offsets: number[],
  needleLength: number,
): SearchHit["snippets"] {
  const snippets: SearchHit["snippets"] = [];
  let index = 0;
  while (index < offsets.length && snippets.length < MAX_SNIPPETS) {
    const first = offsets[index] ?? 0;
    const startNorm = first;
    const startOriginal = toOriginal(haystack, startNorm);
    const from = alignToCodePoint(haystack.text, Math.max(0, startOriginal - CONTEXT), -1);
    let to = Math.min(
      haystack.text.length,
      toOriginal(haystack, startNorm + needleLength) + CONTEXT,
    );
    const ranges: Array<[number, number]> = [];
    while (index < offsets.length) {
      const offset = offsets[index] ?? 0;
      const matchStart = toOriginal(haystack, offset);
      const matchEnd = toOriginal(haystack, offset + needleLength);
      if (matchStart > to) break;
      ranges.push([matchStart - from, matchEnd - from]);
      to = Math.min(haystack.text.length, Math.max(to, matchEnd + CONTEXT));
      index++;
    }
    const end = alignToCodePoint(haystack.text, to, 1);
    snippets.push({ text: haystack.text.slice(from, end), ranges });
  }
  return snippets;
}

/**
 * One searchable document, whichever side it comes from: a `Note` held in a
 * `VaultIndex` on the build machine, or a `SearchDoc` shipped to the browser.
 *
 * @internal
 */
export interface SearchCandidate {
  path: string;
  title: string;
  folder: string;
  tags: string[];
  /** Called at most once per candidate per query; callers cache the result. */
  haystacks: () => Haystacks;
}

function matchesFilters(
  candidate: Pick<SearchCandidate, "folder" | "tags">,
  options: SearchOptions,
): boolean {
  const folder = options.folder;
  if (folder !== undefined && folder !== "") {
    if (candidate.folder !== folder && !candidate.folder.startsWith(`${folder}/`)) {
      return false;
    }
  }
  const tag = options.tag;
  if (tag !== undefined && tag !== "") {
    const wanted = tag.replace(/^#/, "").toLowerCase();
    if (!candidate.tags.some((value) => value.toLowerCase() === wanted)) return false;
  }
  return true;
}

/**
 * The search engine itself, over anything that can produce haystacks. Both
 * `search` (server-side, over a `VaultIndex`) and `searchDocs` (browser, over
 * the static `search.json`) are thin wrappers around this so that
 * normalization, ranking and snippet ranges stay identical on both sides.
 *
 * @internal
 */
export function runSearch(
  candidates: Iterable<SearchCandidate>,
  query: string,
  options: SearchOptions = {},
): SearchHit[] {
  const needle = normalizeForSearch(query.trim());
  if (needle === "") return [];
  const limit = options.limit ?? DEFAULT_LIMIT;
  if (limit <= 0) return [];

  const scored: Array<{ hit: SearchHit; titleMatch: boolean }> = [];
  for (const candidate of candidates) {
    if (!matchesFilters(candidate, options)) continue;
    const stacks = candidate.haystacks();
    const titleOffsets = findAll(stacks.title.norm, needle);
    const bodyOffsets = findAll(stacks.body.norm, needle);
    const count = titleOffsets.length + bodyOffsets.length;
    if (count === 0) continue;
    const snippets = buildSnippets(stacks.body, bodyOffsets, needle.length);
    if (snippets.length === 0 && titleOffsets.length > 0) {
      snippets.push(...buildSnippets(stacks.title, titleOffsets, needle.length));
    }
    scored.push({
      titleMatch: titleOffsets.length > 0,
      hit: { path: candidate.path, title: candidate.title, count, snippets },
    });
  }

  scored.sort((a, b) => {
    if (a.titleMatch !== b.titleMatch) return a.titleMatch ? -1 : 1;
    if (a.hit.count !== b.hit.count) return b.hit.count - a.hit.count;
    return a.hit.path < b.hit.path ? -1 : a.hit.path > b.hit.path ? 1 : 0;
  });
  return scored.slice(0, limit).map((entry) => entry.hit);
}

/**
 * Case-insensitive substring search over titles and bodies. Both haystacks
 * are the *plain text* of the note (see `plainTextBody`), so matches, counts
 * and snippets never involve markdown syntax. Title matches rank first, then
 * the total number of matches.
 */
export function search(index: VaultIndex, query: string, options: SearchOptions = {}): SearchHit[] {
  const candidates: SearchCandidate[] = [];
  for (const note of index.notes.values()) {
    candidates.push({
      path: note.path,
      title: note.title,
      folder: note.folder,
      tags: note.tags,
      haystacks: () => haystacksFor(index, note),
    });
  }
  return runSearch(candidates, query, options);
}
