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

interface Haystack {
	/** Original text with newlines/tabs flattened to spaces (offsets kept). */
	text: string;
	/** NFKC + lower-cased text used for matching. */
	norm: string;
	/** `map[i]` is the offset in `text` of `norm[i]`; `null` when identical. */
	map: number[] | null;
}

interface NoteHaystacks {
	title: Haystack;
	body: Haystack;
}

const cache = new WeakMap<VaultIndex, Map<string, NoteHaystacks>>();

/** NFKC + case folding; the canonical normalization used for matching. */
export function normalizeForSearch(value: string): string {
	return value.normalize("NFKC").toLowerCase();
}

function flatten(value: string): string {
	return value.replace(/[\r\n\t]/g, " ");
}

function makeHaystack(source: string): Haystack {
	const text = flatten(source);
	const norm = normalizeForSearch(text);
	if (norm.length === text.length) return { text, norm, map: null };

	// NFKC changed the length, so build a per-character offset map to keep
	// snippet ranges pointing at the original text.
	const map: number[] = [];
	let built = "";
	for (let i = 0; i < text.length; ) {
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

function haystacksFor(index: VaultIndex, note: Note): NoteHaystacks {
	let perIndex = cache.get(index);
	if (!perIndex) {
		perIndex = new Map();
		cache.set(index, perIndex);
	}
	const existing = perIndex.get(note.path);
	if (existing) return existing;
	const value: NoteHaystacks = {
		title: makeHaystack(note.title),
		body: makeHaystack(note.body),
	};
	perIndex.set(note.path, value);
	return value;
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
		const from = Math.max(0, startOriginal - CONTEXT);
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
		snippets.push({ text: haystack.text.slice(from, to), ranges });
	}
	return snippets;
}

function matchesFilters(note: Note, options: SearchOptions): boolean {
	const folder = options.folder;
	if (folder !== undefined && folder !== "") {
		if (note.folder !== folder && !note.folder.startsWith(`${folder}/`)) {
			return false;
		}
	}
	const tag = options.tag;
	if (tag !== undefined && tag !== "") {
		const wanted = tag.replace(/^#/, "").toLowerCase();
		if (!note.tags.some((value) => value.toLowerCase() === wanted))
			return false;
	}
	return true;
}

/**
 * Case-insensitive substring search over titles and bodies. Title matches
 * rank first, then the total number of matches.
 */
export function search(
	index: VaultIndex,
	query: string,
	options: SearchOptions = {},
): SearchHit[] {
	const needle = normalizeForSearch(query.trim());
	if (needle === "") return [];
	const limit = options.limit ?? DEFAULT_LIMIT;
	if (limit <= 0) return [];

	const scored: Array<{ hit: SearchHit; titleMatch: boolean }> = [];
	for (const note of index.notes.values()) {
		if (!matchesFilters(note, options)) continue;
		const stacks = haystacksFor(index, note);
		const titleOffsets = findAll(stacks.title.norm, needle);
		const bodyOffsets = findAll(stacks.body.norm, needle);
		const count = titleOffsets.length + bodyOffsets.length;
		if (count === 0) continue;
		const snippets = buildSnippets(stacks.body, bodyOffsets, needle.length);
		if (snippets.length === 0 && titleOffsets.length > 0) {
			snippets.push(
				...buildSnippets(stacks.title, titleOffsets, needle.length),
			);
		}
		scored.push({
			titleMatch: titleOffsets.length > 0,
			hit: { path: note.path, title: note.title, count, snippets },
		});
	}

	scored.sort((a, b) => {
		if (a.titleMatch !== b.titleMatch) return a.titleMatch ? -1 : 1;
		if (a.hit.count !== b.hit.count) return b.hit.count - a.hit.count;
		return a.hit.path < b.hit.path ? -1 : a.hit.path > b.hit.path ? 1 : 0;
	});
	return scored.slice(0, limit).map((entry) => entry.hit);
}
