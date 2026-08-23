import { z } from "zod";
import { publicProcedure } from "../index";
import { tagCountSchema } from "../schemas";

export const tagsRouter = {
	/** Every tag with its note count, most used first. */
	list: publicProcedure
		.output(z.array(tagCountSchema))
		.handler(({ context }) => {
			const index = context.vault.getIndex();

			return [...index.tags.entries()]
				.map(([tag, paths]) => ({ tag, count: paths.length }))
				.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
		}),
};
