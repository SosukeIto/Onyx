import type { VaultStatus } from "@Onyx/api/vault-runtime";
import { env } from "@Onyx/env/server";
import type { VaultIndex } from "@Onyx/vault";
import { ORPCError } from "@orpc/server";

interface SyncState {
	index: VaultIndex | null;
	commit: string | null;
	syncedAt: string | null;
	lastError: string | null;
}

const state: SyncState = {
	index: null,
	commit: null,
	syncedAt: null,
	lastError: null,
};

export function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

/** Replace the current index (also clears `lastError`). */
export function setIndex(index: VaultIndex): void {
	state.index = index;
	state.commit = index.commit;
	state.syncedAt = new Date().toISOString();
	state.lastError = null;
}

/** Record the checked-out commit even when the index build fails afterwards. */
export function setCommit(commit: string): void {
	state.commit = commit;
}

export function getCommit(): string | null {
	return state.commit;
}

export function setError(error: unknown): void {
	state.lastError = errorMessage(error);
}

export function clearError(): void {
	state.lastError = null;
}

export function tryGetIndex(): VaultIndex | null {
	return state.index;
}

/** The index, or a 503 when the first build has not succeeded yet. */
export function getIndex(): VaultIndex {
	if (state.index === null) {
		throw new ORPCError("SERVICE_UNAVAILABLE", {
			message: state.lastError
				? `Vault index unavailable: ${state.lastError}`
				: "Vault index is still being built",
		});
	}
	return state.index;
}

export function getStatus(): VaultStatus {
	return {
		commit: state.commit,
		syncedAt: state.syncedAt,
		branch: env.VAULT_BRANCH,
		lastError: state.lastError,
	};
}
