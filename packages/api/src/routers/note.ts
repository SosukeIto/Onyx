import type { Note } from "@Onyx/vault";
import { z } from "zod";
import { publicProcedure } from "../index";
import { noteDetailSchema, noteSummarySchema } from "../schemas";
import {
	buildNoteDetail,
	matchesFolder,
	noteSummary,
	requireNotePath,
} from "./shared";

const DEFAULT_LIMIT = 50;
const DEFAULT_RECENT_LIMIT = 10;

const sortSchema = z.enum(["modified", "title", "path"]);

/** Newest first; notes without a known commit date sort last. */
function compareModified(a: Note, b: Note): number {
	if (a.modified === b.modified) return a.path.localeCompare(b.path);
	if (a.modified === null) return 1;
	if (b.modified === null) return -1;
	return a.modified < b.modified ? 1 : -1;
}

function comparator(
	sort: z.infer<typeof sortSchema>,
): (a: Note, b: Note) => number {
	if (sort === "title") return (a, b) => a.title.localeCompare(b.title);
	if (sort === "path") return (a, b) => a.path.localeCompare(b.path);
	return compareModified;
}

/** Obsidian tags are hierarchical: `foo` also selects `foo/bar`. */
function hasTag(note: Note, tag: string): boolean {
	return note.tags.some(
		(value) => value === tag || value.startsWith(`${tag}/`),
	);
}

export const noteRouter = {
	/** Rendered note, links and backlinks. `path` may omit the `.md` suffix. */
	get: publicProcedure
		.input(z.object({ path: z.string().min(1) }))
		.output(noteDetailSchema)
		.handler(async ({ input, context }) => {
			const index = context.vault.getIndex();
			return buildNoteDetail(index, requireNotePath(index, input.path));
		}),

	list: publicProcedure
		.input(
			z
				.object({
					folder: z.string().optional(),
					tag: z.string().optional(),
					sort: sortSchema.optional(),
					limit: z.number().int().min(1).max(500).optional(),
					offset: z.number().int().min(0).optional(),
				})
				.optional(),
		)
		.output(
			z.object({ items: z.array(noteSummarySchema), total: z.number().int() }),
		)
		.handler(({ input, context }) => {
			const index = context.vault.getIndex();
			const folder = input?.folder;
			const tag = input?.tag;

			const matched = [...index.notes.values()].filter((note) => {
				if (folder !== undefined && !matchesFolder(note.folder, folder)) {
					return false;
				}
				if (tag !== undefined && !hasTag(note, tag)) return false;
				return true;
			});

			matched.sort(comparator(input?.sort ?? "modified"));

			const offset = input?.offset ?? 0;
			const limit = input?.limit ?? DEFAULT_LIMIT;

			return {
				items: matched.slice(offset, offset + limit).map(noteSummary),
				total: matched.length,
			};
		}),

	/** Most recently committed notes. */
	recent: publicProcedure
		.input(
			z
				.object({ limit: z.number().int().min(1).max(100).optional() })
				.optional(),
		)
		.output(z.array(noteSummarySchema))
		.handler(({ input, context }) => {
			const index = context.vault.getIndex();
			const notes = [...index.notes.values()].sort(compareModified);
			return notes
				.slice(0, input?.limit ?? DEFAULT_RECENT_LIMIT)
				.map(noteSummary);
		}),
};
