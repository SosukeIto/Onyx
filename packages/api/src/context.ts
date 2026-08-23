import type { Context as HonoContext } from "hono";

import type { VaultRuntime } from "./vault-runtime";

export type CreateContextOptions = {
	context: HonoContext;
	/** Injected by apps/server; see `./vault-runtime`. */
	vault: VaultRuntime;
};

export async function createContext(options: CreateContextOptions) {
	return {
		auth: null,
		session: null,
		vault: options.vault,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
