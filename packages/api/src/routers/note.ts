import type { Note } from "@Onyx/vault";
import { normalizeFrontmatterTags } from "@Onyx/vault/tags";
import { z } from "zod";
import { publicProcedure } from "../index";
import type { ClaudeLog } from "../schemas";
import {
	claudeLogListSchema,
	noteDetailSchema,
	noteSummarySchema,
} from "../schemas";
import {
	buildNoteDetail,
	matchesFolder,
	noteSummary,
	requireNotePath,
} from "./shared";

const DEFAULT_LIMIT = 50;
const DEFAULT_RECENT_LIMIT = 10;

/** Tag every exported Claude Code conversation carries in its frontmatter. */
const CLAUDE_LOG_TAG = "claude-log";
/** `02_ClaudeLogs/projects/<name>/…` — the fallback source for `project`. */
const PROJECT_FROM_PATH = /^02_ClaudeLogs\/projects\/([^/]+)\//;

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

/** YAML scalars we accept as text; anything else (lists, maps) is `null`. */
function text(value: unknown): string | null {
	if (typeof value === "string")
		return value.trim() === "" ? null : value.trim();
	if (typeof value === "number") return String(value);
	if (value instanceof Date) return value.toISOString();
	return null;
}

/**
 * A log entry is a note tagged `claude-log` in its frontmatter *and* carrying
 * a `session_id`. The second half excludes the `02_ClaudeLogs/Claude Log.md`
 * hub note, which wears the tag but is not a conversation.
 */
function isClaudeLog(note: Note): boolean {
	const tags = normalizeFrontmatterTags(note.frontmatter.tags);
	if (!tags.some((tag) => tag.toLowerCase() === CLAUDE_LOG_TAG)) return false;
	return text(note.frontmatter.session_id) !== null;
}

function toClaudeLog(note: Note): ClaudeLog {
	return {
		path: note.path,
		title: note.title,
		date: text(note.frontmatter.date),
		created: text(note.frontmatter.created),
		project:
			text(note.frontmatter.project) ??
			PROJECT_FROM_PATH.exec(note.path)?.[1] ??
			null,
		sessionId: text(note.frontmatter.session_id),
	};
}

/** Newest first by `date`, then by `created`; missing values sort last. */
function compareLogs(a: ClaudeLog, b: ClaudeLog): number {
	for (const key of ["date", "created"] as const) {
		const left = a[key];
		const right = b[key];
		if (left === right) continue;
		if (left === null) return 1;
		if (right === null) return -1;
		return left < right ? 1 : -1;
	}
	return a.path.localeCompare(b.path);
}

function countProjects(logs: ClaudeLog[]): Array<{
	project: string;
	count: number;
}> {
	const counts = new Map<string, number>();
	for (const log of logs) {
		if (log.project === null) continue;
		counts.set(log.project, (counts.get(log.project) ?? 0) + 1);
	}
	return [...counts]
		.map(([project, count]) => ({ project, count }))
		.sort((a, b) => b.count - a.count || a.project.localeCompare(b.project));
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

	/**
	 * Claude Code conversation logs, newest first. `projects` always counts
	 * every log so the client can switch filters without a second request.
	 */
	logs: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(500).optional(),
					offset: z.number().int().min(0).optional(),
					project: z.string().optional(),
				})
				.optional(),
		)
		.output(claudeLogListSchema)
		.handler(({ input, context }) => {
			const index = context.vault.getIndex();

			const logs = [...index.notes.values()]
				.filter(isClaudeLog)
				.map(toClaudeLog)
				.sort(compareLogs);

			const project = input?.project;
			const matched =
				project === undefined || project === ""
					? logs
					: logs.filter((log) => log.project === project);

			const offset = input?.offset ?? 0;
			const limit = input?.limit ?? DEFAULT_LIMIT;

			return {
				items: matched.slice(offset, offset + limit),
				total: matched.length,
				projects: countProjects(logs),
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
