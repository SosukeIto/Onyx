import { env } from "@Onyx/env/server";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../index";
import {
	syncResultSchema,
	treeFolderSchema,
	vaultStatusSchema,
} from "../schemas";

/** Length-independent comparison so the token is not leaked by timing. */
function secretEquals(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i += 1) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

export const vaultRouter = {
	/** Sync state. Never throws: usable while the index is still missing. */
	status: publicProcedure.output(vaultStatusSchema).handler(({ context }) => {
		const status = context.vault.status();
		const index = context.vault.tryGetIndex();

		return {
			commit: status.commit,
			syncedAt: status.syncedAt,
			noteCount: index?.notes.size ?? 0,
			attachmentCount: index?.attachments.size ?? 0,
			branch: status.branch,
			lastError: status.lastError,
		};
	}),

	/** Folder tree of the whole vault. */
	tree: publicProcedure.output(treeFolderSchema).handler(({ context }) => {
		return context.vault.getIndex().tree;
	}),

	/** Manual / webhook sync trigger, gated by `SYNC_TOKEN`. */
	sync: publicProcedure
		.input(z.object({ token: z.string().min(1) }))
		.output(syncResultSchema)
		.handler(async ({ input, context }) => {
			const expected = env.SYNC_TOKEN;
			if (!expected) {
				throw new ORPCError("FORBIDDEN", {
					message: "Remote sync is disabled (SYNC_TOKEN is not set)",
				});
			}
			if (!secretEquals(input.token, expected)) {
				throw new ORPCError("FORBIDDEN", { message: "Invalid sync token" });
			}

			return context.vault.sync();
		}),
};
