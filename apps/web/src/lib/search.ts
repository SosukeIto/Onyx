import { searchDocs } from "@Onyx/vault/static/client-search";
import type { SearchDoc } from "@Onyx/vault/static/types";
import { queryOptions, skipToken } from "@tanstack/react-query";

/**
 * Full-text search, run in the browser.
 *
 * The whole corpus is one file in the static bundle (`/vault/search.json`,
 * plain text with no markup), so searching is a pure function over an array
 * the client already has — no request per keystroke. The engine itself is
 * shared with the build step (`@Onyx/vault/static/client-search`).
 *
 * The file is served through `/api/vault/search`, not straight off the CDN:
 * that route checks the session first, so the vault's text is never readable
 * without logging in.
 */

const DOCS_PATH = "/api/vault/search";
const SEARCH_LIMIT = 50;

async function loadDocs(): Promise<SearchDoc[]> {
  const response = await fetch(DOCS_PATH, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error(`search index unavailable (${response.status})`);
  }
  return (await response.json()) as SearchDoc[];
}

/** The corpus. Fetched once per session and kept for as long as the tab lives. */
export function searchDocsOptions() {
  return queryOptions({
    queryKey: ["vault", "search-docs"] as const,
    queryFn: loadDocs,
    // The bundle is immutable for the lifetime of a deploy.
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * Hits for one query. `folder` / `tag` come from the facet column.
 *
 * This is derived from {@link searchDocsOptions} rather than being its own
 * request: the query key carries the corpus key so both observers share the
 * single fetch, and `select` runs the match.
 */
export function searchOptions(q: string, facets?: { folder?: string; tag?: string }) {
  const query = q.trim();
  return queryOptions({
    ...searchDocsOptions(),
    queryFn: query === "" ? skipToken : loadDocs,
    select: (docs: SearchDoc[]) =>
      query === ""
        ? []
        : searchDocs(docs, query, {
            limit: SEARCH_LIMIT,
            folder: facets?.folder,
            tag: facets?.tag,
          }),
  });
}
