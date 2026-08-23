import type { TreeFolder, TreeNode } from "@Onyx/vault";
import { z } from "zod";

export const linkKindSchema = z.enum(["wiki", "embed", "markdown"]);

export const headingSchema = z.object({
	depth: z.union([
		z.literal(1),
		z.literal(2),
		z.literal(3),
		z.literal(4),
		z.literal(5),
		z.literal(6),
	]),
	text: z.string(),
	slug: z.string(),
	line: z.number().int(),
});

export const frontmatterSchema = z.record(z.string(), z.unknown());

/** Outgoing link as exposed to clients (the `from` is implied by the note). */
export const noteLinkSchema = z.object({
	to: z.string().nullable(),
	target: z.string(),
	alias: z.string().nullable(),
	kind: linkKindSchema,
});

export const backlinkSchema = z.object({
	from: z.string(),
	fromTitle: z.string(),
	line: z.number().int(),
	excerpt: z.string(),
});

export const noteSummarySchema = z.object({
	path: z.string(),
	title: z.string(),
	folder: z.string(),
	tags: z.array(z.string()),
	modified: z.string().nullable(),
});

export const noteDetailSchema = z.object({
	path: z.string(),
	title: z.string(),
	frontmatter: frontmatterSchema,
	html: z.string(),
	headings: z.array(headingSchema),
	tags: z.array(z.string()),
	links: z.array(noteLinkSchema),
	backlinks: z.array(backlinkSchema),
	unresolvedTargets: z.array(z.string()),
	modified: z.string().nullable(),
	size: z.number().int(),
});

export const treeFileSchema = z.object({
	kind: z.literal("file"),
	name: z.string(),
	path: z.string(),
	title: z.string(),
});

export const treeFolderSchema: z.ZodType<TreeFolder, TreeFolder> = z.lazy(() =>
	z.object({
		kind: z.literal("folder"),
		name: z.string(),
		path: z.string(),
		noteCount: z.number().int(),
		children: z.array(treeNodeSchema),
	}),
);

export const treeNodeSchema: z.ZodType<TreeNode, TreeNode> = z.lazy(() =>
	z.union([treeFileSchema, treeFolderSchema]),
);

export const searchHitSchema = z.object({
	path: z.string(),
	title: z.string(),
	count: z.number().int(),
	snippets: z.array(
		z.object({
			text: z.string(),
			ranges: z.array(z.tuple([z.number().int(), z.number().int()])),
		}),
	),
});

export const vaultStatusSchema = z.object({
	commit: z.string().nullable(),
	syncedAt: z.string().nullable(),
	noteCount: z.number().int(),
	attachmentCount: z.number().int(),
	branch: z.string(),
	lastError: z.string().nullable(),
});

export const syncResultSchema = z.object({
	commit: z.string(),
	changed: z.boolean(),
	durationMs: z.number().int(),
});

export const graphNodeSchema = z.object({
	/** Note path, or `unresolved:<raw target>`. */
	id: z.string(),
	title: z.string(),
	kind: z.enum(["note", "unresolved"]),
	inDegree: z.number().int(),
});

export const graphEdgeSchema = z.object({
	source: z.string(),
	target: z.string(),
});

export const graphDataSchema = z.object({
	nodes: z.array(graphNodeSchema),
	edges: z.array(graphEdgeSchema),
});

export const tagCountSchema = z.object({
	tag: z.string(),
	count: z.number().int(),
});

export const unresolvedTargetSchema = z.object({
	target: z.string(),
	count: z.number().int(),
	from: z.array(z.string()),
});

export const calendarSchema = z.object({
	days: z.array(
		z.object({
			date: z.string(),
			path: z.string(),
		}),
	),
});

export const dateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export type NoteDetail = z.infer<typeof noteDetailSchema>;
export type NoteSummary = z.infer<typeof noteSummarySchema>;
