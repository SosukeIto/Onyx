import { search } from "@Onyx/vault";
import { z } from "zod";
import { publicProcedure } from "../index";
import { searchHitSchema } from "../schemas";

export const searchRouter = {
	query: publicProcedure
		.input(
			z.object({
				q: z.string(),
				limit: z.number().int().min(1).max(100).optional(),
				folder: z.string().optional(),
				tag: z.string().optional(),
			}),
		)
		.output(z.array(searchHitSchema))
		.handler(({ input, context }) => {
			const query = input.q.trim();
			if (query === "") return [];

			return search(context.vault.getIndex(), query, {
				limit: input.limit,
				folder: input.folder,
				tag: input.tag,
			});
		}),
};
