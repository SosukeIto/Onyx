import type { VaultIndex } from "@Onyx/vault";

/** Snapshot of the sync loop, safe to read before the first index is built. */
export interface VaultStatus {
	/** HEAD of the clone, `null` before the first successful clone/fetch. */
	commit: string | null;
	/** ISO 8601 timestamp of the last successful index build. */
	syncedAt: string | null;
	/** Branch that is being mirrored. */
	branch: string;
	/** Message of the last failure, cleared after a successful sync. */
	lastError: string | null;
}

export interface SyncResult {
	commit: string;
	/** `true` when the index was rebuilt (new commit, or no index yet). */
	changed: boolean;
	durationMs: number;
}

/**
 * Everything the routers need from the server's sync module.
 *
 * `packages/api` must not import `apps/server` (that would be a cycle), so the
 * server injects an implementation through the request context.
 */
export interface VaultRuntime {
	/** Throws `ORPCError("SERVICE_UNAVAILABLE")` when the index is not ready. */
	getIndex(): VaultIndex;
	/** Same, but returns `null` instead of throwing. */
	tryGetIndex(): VaultIndex | null;
	status(): VaultStatus;
	/** Run a sync immediately (deduplicated while one is in flight). */
	sync(): Promise<SyncResult>;
}
