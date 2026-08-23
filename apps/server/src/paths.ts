import { env } from "@Onyx/env/server";
import path from "node:path";

/**
 * Repository root. This file lives at `apps/server/src/paths.ts`, so the root
 * is three levels up. `process.cwd()` is deliberately not used: turbo starts
 * the dev server with `apps/server` as the working directory, while a compiled
 * binary may be started from anywhere.
 */
export const repoRoot = path.resolve(import.meta.dir, "../../..");

/**
 * Absolute path of the vault clone. `VAULT_DIR` is resolved against the
 * repository root when relative (the default `data/vault` therefore always
 * means `<repo>/data/vault`).
 */
export const vaultDir = path.isAbsolute(env.VAULT_DIR)
	? path.normalize(env.VAULT_DIR)
	: path.resolve(repoRoot, env.VAULT_DIR);
