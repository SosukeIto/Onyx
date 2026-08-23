import type { NoteSummary } from "@Onyx/vault/static/types";
import { queryOptions, skipToken } from "@tanstack/react-query";

import {
  fetchCatalog,
  fetchDailyNote,
  fetchGraph,
  fetchLogs,
  fetchNote,
  type VaultCatalog,
} from "#/server/vault";

/**
 * Shared query option builders.
 *
 * Every list screen is a slice of one payload: `fetchCatalog()` returns the
 * static bundle's manifest (minus the graph and the Claude logs, which have
 * their own server functions). The slices below all share the same query key,
 * so TanStack Query keeps exactly one cache entry and one request for them —
 * `select` is what makes each screen see only its own shape.
 *
 * `__root`'s shell and the route components ask for the same note, so they
 * MUST build the options the same way: identical keys let both read one cache
 * entry, and identical `staleTime` keeps the two observers from re-fetching
 * each other's data.
 */

/** The bundle only changes on deploy, so nothing needs to be re-fetched eagerly. */
export const DETAIL_STALE_TIME = 5 * 60_000;
/** Hops kept around `?center=` on the graph screen. */
const GRAPH_DEPTH = 2;
/** `note.list` used to page; the tag screen has always asked for one page. */
const TAG_NOTE_LIMIT = 200;
const LOG_LIMIT = 200;

const CATALOG_KEY = ["vault", "catalog"] as const;

/** Newest first; notes without a known commit date sort last. */
function compareModified(a: NoteSummary, b: NoteSummary): number {
  if (a.modified === b.modified) return a.path.localeCompare(b.path);
  if (a.modified === null) return 1;
  if (b.modified === null) return -1;
  return a.modified < b.modified ? 1 : -1;
}

function notesByModified(catalog: VaultCatalog): NoteSummary[] {
  return Object.values(catalog.notes).sort(compareModified);
}

/** Obsidian tags are hierarchical: `foo` also selects `foo/bar`. */
function hasTag(note: NoteSummary, tag: string): boolean {
  return note.tags.some((value) => value === tag || value.startsWith(`${tag}/`));
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * The one request every list screen is a view of.
 *
 * Route loaders use this directly (`ensureQueryData` does not run `select`);
 * the components below add their own `select` on top of the same key.
 */
export function catalogOptions() {
  return queryOptions({
    queryKey: CATALOG_KEY,
    queryFn: () => fetchCatalog(),
    staleTime: DETAIL_STALE_TIME,
  });
}

/** Daily notes that exist in `00_Daily/YYYY/MM/DD.md` for one month. */
export function daysInMonth(
  catalog: VaultCatalog,
  value: { year: number; month: number },
): Array<{ date: string; path: string }> {
  const prefix = `${value.year}-${pad(value.month)}-`;
  return catalog.daily.filter((day) => day.date.startsWith(prefix));
}

export function treeOptions() {
  return queryOptions({
    ...catalogOptions(),
    select: (catalog: VaultCatalog) => catalog.tree,
  });
}

/**
 * What the header and `/settings` show instead of the old git sync state:
 * which commit of the vault this bundle was baked from, and when.
 */
export function statusOptions() {
  return queryOptions({
    ...catalogOptions(),
    select: (catalog: VaultCatalog) => ({
      commit: catalog.commit,
      builtAt: catalog.builtAt,
      branch: catalog.branch,
      noteCount: catalog.noteCount,
      attachmentCount: catalog.attachmentCount,
    }),
  });
}

export function recentOptions(limit: number) {
  return queryOptions({
    ...catalogOptions(),
    select: (catalog: VaultCatalog) => notesByModified(catalog).slice(0, limit),
  });
}

export function tagsOptions() {
  return queryOptions({
    ...catalogOptions(),
    select: (catalog: VaultCatalog) => catalog.tags,
  });
}

export function unresolvedOptions() {
  return queryOptions({
    ...catalogOptions(),
    select: (catalog: VaultCatalog) => catalog.unresolved,
  });
}

export function tagNotesOptions(tag: string) {
  return queryOptions({
    ...catalogOptions(),
    select: (catalog: VaultCatalog) => {
      const matched = notesByModified(catalog).filter((note) => hasTag(note, tag));
      return { items: matched.slice(0, TAG_NOTE_LIMIT), total: matched.length };
    },
  });
}

/** The month grid of `/daily`, as `{ days }` (what `components/daily` wants). */
export function calendarOptions(value: { year: number; month: number }) {
  return queryOptions({
    ...catalogOptions(),
    select: (catalog: VaultCatalog) => ({ days: daysInMonth(catalog, value) }),
  });
}

export function noteDetailOptions(path: string | undefined) {
  return queryOptions({
    queryKey: ["vault", "note", path] as const,
    queryFn: path === undefined ? skipToken : () => fetchNote({ data: { path } }),
    retry: false,
    staleTime: DETAIL_STALE_TIME,
  });
}

export function dailyDetailOptions(date: string | undefined) {
  return queryOptions({
    queryKey: ["vault", "daily", date] as const,
    queryFn: date === undefined ? skipToken : () => fetchDailyNote({ data: { date } }),
    retry: false,
    staleTime: DETAIL_STALE_TIME,
  });
}

/** Claude logs, newest first; `project` narrows to one project facet. */
export function logsOptions(project?: string) {
  return queryOptions({
    queryKey: ["vault", "logs", project ?? null] as const,
    queryFn: () => fetchLogs({ data: { limit: LOG_LIMIT, project } }),
    staleTime: DETAIL_STALE_TIME,
  });
}

/** Whole vault without `center`; two hops around it with one. */
export function graphOptions(center?: string) {
  return queryOptions({
    queryKey: ["vault", "graph", center ?? null] as const,
    queryFn: () =>
      fetchGraph({
        data: center ? { center, depth: GRAPH_DEPTH } : {},
      }),
    retry: false,
    staleTime: DETAIL_STALE_TIME,
  });
}
