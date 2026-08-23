import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		CORS_ORIGIN: z.url(),
		/** Git URL of the Obsidian vault to mirror. */
		VAULT_REPO_URL: z
			.string()
			.min(1)
			.default("https://github.com/SosukeIto/my-vault.git"),
		VAULT_BRANCH: z.string().min(1).default("main"),
		/** Local directory the vault is cloned into (relative to the repo root). */
		VAULT_DIR: z.string().min(1).default("data/vault"),
		/** Seconds between `git fetch` polls. 0 disables polling. */
		SYNC_INTERVAL_SEC: z.coerce.number().int().min(0).default(300),
		/** Shared secret for the manual/webhook sync endpoint. Empty disables remote sync triggers. */
		SYNC_TOKEN: z.string().optional(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
