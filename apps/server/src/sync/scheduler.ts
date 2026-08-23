import type { SyncResult } from "@Onyx/api/vault-runtime";
import { env } from "@Onyx/env/server";
import { buildIndex } from "@Onyx/vault";
import { vaultDir } from "../paths";
import { ensureClone, fetchAndReset, fileDates, headCommit } from "./git";
import {
	clearError,
	errorMessage,
	getCommit,
	setCommit,
	setError,
	setIndex,
	tryGetIndex,
} from "./state";

/**
 * `bun run --hot` re-evaluates modules but keeps globals, so the interval is
 * parked on `globalThis` to avoid stacking timers on every reload.
 */
type SyncGlobal = typeof globalThis & {
	__onyxSyncTimer?: ReturnType<typeof setInterval>;
};

/** Deduplicates concurrent syncs: callers share the in-flight run. */
let inFlight: Promise<SyncResult> | null = null;

async function runSync(): Promise<SyncResult> {
	const startedAt = performance.now();

	try {
		const cloned = await ensureClone({
			url: env.VAULT_REPO_URL,
			branch: env.VAULT_BRANCH,
			dir: vaultDir,
		});

		if (!cloned) {
			await fetchAndReset(vaultDir, env.VAULT_BRANCH);
		}

		const commit = await headCommit(vaultDir);
		const previousCommit = getCommit();
		const hasIndex = tryGetIndex() !== null;
		setCommit(commit);

		if (hasIndex && commit === previousCommit) {
			clearError();
			return { commit, changed: false, durationMs: elapsed(startedAt) };
		}

		const dates = await fileDates(vaultDir);
		const index = await buildIndex({
			root: vaultDir,
			commit,
			fileDates: dates,
		});
		setIndex(index);

		return { commit, changed: true, durationMs: elapsed(startedAt) };
	} catch (error) {
		setError(error);
		throw error;
	}
}

function elapsed(startedAt: number): number {
	return Math.round(performance.now() - startedAt);
}

/** Sync now, or join the run that is already in progress. */
export function syncNow(): Promise<SyncResult> {
	if (inFlight) return inFlight;

	const task = runSync().finally(() => {
		inFlight = null;
	});
	inFlight = task;
	return task;
}

/**
 * Kick off the initial sync and, when `SYNC_INTERVAL_SEC > 0`, poll the remote.
 * Failures are logged and stored in the state: the HTTP server always starts.
 */
export function startSync(): void {
	const globals = globalThis as SyncGlobal;

	if (globals.__onyxSyncTimer) {
		clearInterval(globals.__onyxSyncTimer);
		globals.__onyxSyncTimer = undefined;
	}

	void syncNow()
		.then((result) => {
			console.log(
				`[sync] ${result.commit.slice(0, 7)} ready in ${result.durationMs}ms`,
			);
		})
		.catch((error: unknown) => {
			console.error(`[sync] initial sync failed: ${errorMessage(error)}`);
		});

	if (env.SYNC_INTERVAL_SEC > 0) {
		globals.__onyxSyncTimer = setInterval(() => {
			void syncNow().catch((error: unknown) => {
				console.error(`[sync] scheduled sync failed: ${errorMessage(error)}`);
			});
		}, env.SYNC_INTERVAL_SEC * 1000);
	}
}
