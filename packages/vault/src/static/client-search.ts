/**
 * Client-side search over the static `search.json` bundle.
 *
 * The whole engine (NFKC normalization, title-first ranking, snippet
 * `ranges`) lives in `../search` and is shared with the server-side
 * `search(index, …)`; this module only turns `SearchDoc`s into candidates and
 * caches their haystacks. Nothing here touches node built-ins, so it bundles
 * for the browser.
 */
import type { Haystacks, SearchOptions } from "../search";
import { makeHaystack, runSearch } from "../search";
import { plainText } from "../text";
import type { SearchHit } from "../types";
import type { SearchDoc } from "./types";

export type { SearchOptions as ClientSearchOptions };

/**
 * Haystacks are keyed by the `SearchDoc[]` the caller passes in, so repeated
 * queries over the same (immutable) array only pay the normalization cost
 * once and the whole cache is collected with the array.
 */
const caches = new WeakMap<readonly SearchDoc[], Map<string, Haystacks>>();

function haystacksFor(docs: readonly SearchDoc[], doc: SearchDoc): Haystacks {
  let perArray = caches.get(docs);
  if (!perArray) {
    perArray = new Map();
    caches.set(docs, perArray);
  }
  const existing = perArray.get(doc.path);
  if (existing) return existing;
  const value: Haystacks = {
    // `doc.text` is already plain (the build step ran `plainTextBody`), the
    // title still carries whatever markup the frontmatter had.
    title: makeHaystack(plainText(doc.title)),
    body: makeHaystack(doc.text),
  };
  perArray.set(doc.path, value);
  return value;
}

/**
 * Same semantics as `search(index, query, options)`: case-insensitive
 * substring match over title and body, title matches first, then match count,
 * then path. `snippets[].ranges` are `[start, end)` offsets inside
 * `snippets[].text`.
 */
export function searchDocs(
  docs: readonly SearchDoc[],
  query: string,
  options: SearchOptions = {},
): SearchHit[] {
  const candidates = docs.map((doc) => ({
    path: doc.path,
    title: doc.title,
    folder: doc.folder,
    tags: doc.tags,
    haystacks: () => haystacksFor(docs, doc),
  }));
  return runSearch(candidates, query, options);
}
