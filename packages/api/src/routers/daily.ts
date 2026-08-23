import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../index";
import { calendarSchema, dateSchema, noteDetailSchema } from "../schemas";
import { buildNoteDetail, DAILY_ROOT, findNotePath } from "./shared";

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

export const dailyRouter = {
	/** Daily notes that exist in `00_Daily/YYYY/MM/DD.md` for one month. */
	calendar: publicProcedure
		.input(
			z.object({
				year: z.number().int().min(1000).max(9999),
				month: z.number().int().min(1).max(12),
			}),
		)
		.output(calendarSchema)
		.handler(({ input, context }) => {
			const index = context.vault.getIndex();
			const month = pad(input.month);
			const prefix = `${DAILY_ROOT}/${input.year}/${month}/`;

			const days: Array<{ date: string; path: string }> = [];
			for (const notePath of index.notes.keys()) {
				if (!notePath.startsWith(prefix)) continue;

				const matched = /^(\d{2})\.md$/.exec(notePath.slice(prefix.length));
				const day = matched?.[1];
				if (!day) continue;

				days.push({ date: `${input.year}-${month}-${day}`, path: notePath });
			}

			days.sort((a, b) => a.date.localeCompare(b.date));
			return { days };
		}),

	/** Same payload as `note.get`, addressed by date. */
	get: publicProcedure
		.input(z.object({ date: dateSchema }))
		.output(noteDetailSchema)
		.handler(async ({ input, context }) => {
			const index = context.vault.getIndex();
			const [year, month, day] = input.date.split("-");
			const candidate = `${DAILY_ROOT}/${year}/${month}/${day}.md`;

			const found = findNotePath(index, candidate);
			if (found === null) {
				throw new ORPCError("NOT_FOUND", {
					message: `No daily note for ${input.date}`,
				});
			}

			return buildNoteDetail(index, found);
		}),
};
