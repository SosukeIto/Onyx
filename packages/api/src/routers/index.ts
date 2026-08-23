import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { dailyRouter } from "./daily";
import { graphRouter } from "./graph";
import { noteRouter } from "./note";
import { searchRouter } from "./search";
import { tagsRouter } from "./tags";
import { unresolvedRouter } from "./unresolved";
import { vaultRouter } from "./vault";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	vault: vaultRouter,
	note: noteRouter,
	search: searchRouter,
	daily: dailyRouter,
	graph: graphRouter,
	tags: tagsRouter,
	unresolved: unresolvedRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
