import { skipToken } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

/**
 * Shared query option builders.
 *
 * `__root` and the route components ask for the same note, so they MUST build
 * the options the same way: identical keys let TanStack Query serve both from
 * one cache entry (one request), and identical `staleTime` keeps the two
 * observers from re-fetching each other's data.
 */

/** The vault only changes on sync, so nothing needs to be re-fetched eagerly. */
export const DETAIL_STALE_TIME = 5 * 60_000;
const STATUS_REFETCH_INTERVAL = 60_000;

export function noteDetailOptions(path: string | undefined) {
	return orpc.note.get.queryOptions({
		input: path === undefined ? skipToken : { path },
		retry: false,
		staleTime: DETAIL_STALE_TIME,
	});
}

export function dailyDetailOptions(date: string | undefined) {
	return orpc.daily.get.queryOptions({
		input: date === undefined ? skipToken : { date },
		retry: false,
		staleTime: DETAIL_STALE_TIME,
	});
}

export function calendarOptions(value: { year: number; month: number }) {
	return orpc.daily.calendar.queryOptions({
		input: value,
		staleTime: DETAIL_STALE_TIME,
	});
}

export function treeOptions() {
	return orpc.vault.tree.queryOptions({ staleTime: DETAIL_STALE_TIME });
}

export function statusOptions() {
	return orpc.vault.status.queryOptions({
		refetchInterval: STATUS_REFETCH_INTERVAL,
	});
}

export function recentOptions(limit: number) {
	return orpc.note.recent.queryOptions({
		input: { limit },
		staleTime: DETAIL_STALE_TIME,
	});
}

export function tagNotesOptions(tag: string) {
	return orpc.note.list.queryOptions({
		input: { tag, limit: 200 },
		staleTime: DETAIL_STALE_TIME,
	});
}

export function unresolvedOptions() {
	return orpc.unresolved.list.queryOptions({ staleTime: DETAIL_STALE_TIME });
}

export function searchOptions(q: string) {
	return orpc.search.query.queryOptions({
		input: q === "" ? skipToken : { q, limit: 50 },
		staleTime: DETAIL_STALE_TIME,
	});
}
