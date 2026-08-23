import { z } from "zod";
import { publicProcedure } from "../index";
import { unresolvedTargetSchema } from "../schemas";

export const unresolvedRouter = {
	/** Link targets that do not exist yet, with the notes pointing at them. */
	list: publicProcedure
		.output(z.array(unresolvedTargetSchema))
		.handler(({ context }) => {
			const index = context.vault.getIndex();

			return [...index.unresolved.entries()]
				.map(([target, links]) => ({
					target,
					count: links.length,
					from: [...new Set(links.map((link) => link.from))].sort((a, b) =>
						a.localeCompare(b),
					),
				}))
				.sort((a, b) => b.count - a.count || a.target.localeCompare(b.target));
		}),
};
