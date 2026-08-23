import type { VaultRuntime } from "@Onyx/api/vault-runtime";
import { syncNow } from "./scheduler";
import { getIndex, getStatus, tryGetIndex } from "./state";

export { startSync, syncNow } from "./scheduler";
export { getStatus, tryGetIndex } from "./state";

/** Implementation of the contract consumed by the oRPC routers. */
export const vaultRuntime: VaultRuntime = {
	getIndex,
	tryGetIndex,
	status: getStatus,
	sync: syncNow,
};
