import type { Link, Note, VaultIndex } from "@Onyx/vault";
import { renderNote } from "@Onyx/vault";
import { ORPCError } from "@orpc/server";
import type { NoteDetail, NoteSummary } from "../schemas";

/** Folder that holds the `YYYY/MM/DD.md` daily notes. */
export const DAILY_ROOT = "00_Daily";

const EXCERPT_MAX = 160;

/** Normalize a client supplied vault path (leading slashes, `./`, `\`). */
function normalizePath(input: string): string {
	return input
		.trim()
		.replaceAll("\\", "/")
		.replace(/^\.\//, "")
		.replace(/^\/+/, "");
}

/** Accepts a path with or without the `.md` extension. Returns null if unknown. */
export function findNotePath(index: VaultIndex, input: string): string | null {
	const normalized = normalizePath(input);
	if (normalized === "") return null;
	if (index.notes.has(normalized)) return normalized;

	const withExtension = `${normalized}.md`;
	if (index.notes.has(withExtension)) return withExtension;

	return null;
}

export function requireNotePath(index: VaultIndex, input: string): string {
	const found = findNotePath(index, input);
	if (found === null) {
		throw new ORPCError("NOT_FOUND", { message: `Note not found: ${input}` });
	}
	return found;
}

export function noteSummary(note: Note): NoteSummary {
	return {
		path: note.path,
		title: note.title,
		folder: note.folder,
		tags: note.tags,
		modified: note.modified,
	};
}

/** `folder` matches the folder itself and everything below it. */
export function matchesFolder(noteFolder: string, folder: string): boolean {
	const wanted = normalizePath(folder).replace(/\/+$/, "");
	if (wanted === "") return true;
	return noteFolder === wanted || noteFolder.startsWith(`${wanted}/`);
}

function condense(text: string): string {
	const collapsed = text.replace(/\s+/g, " ").trim();
	return collapsed.length > EXCERPT_MAX
		? `${collapsed.slice(0, EXCERPT_MAX)}…`
		: collapsed;
}

/**
 * Source line around a backlink. `Link.line` counts lines in the original file
 * while `Note.body` has the frontmatter stripped, so the reported line is only
 * used when it actually contains the link target.
 */
export function excerptForLink(index: VaultIndex, link: Link): string {
	const source = index.notes.get(link.from);
	if (!source) return "";

	const lines = source.body.split("\n");
	const reported = lines[link.line];
	if (reported?.includes(link.target)) {
		return condense(reported);
	}

	const matched = lines.find((line) => line.includes(link.target));
	if (matched !== undefined) return condense(matched);

	return condense(reported ?? "");
}

/** Full note payload shared by `note.get` and `daily.get`. */
export async function buildNoteDetail(
	index: VaultIndex,
	path: string,
): Promise<NoteDetail> {
	const note = index.notes.get(path);
	if (!note) {
		throw new ORPCError("NOT_FOUND", { message: `Note not found: ${path}` });
	}

	const rendered = await renderNote(index, path);
	const links = rendered.links.length > 0 ? rendered.links : note.links;
	const backlinks = index.backlinks.get(path) ?? [];

	const unresolvedTargets = [
		...new Set(
			links.filter((link) => link.to === null).map((link) => link.target),
		),
	];

	return {
		path: note.path,
		title: note.title,
		frontmatter: note.frontmatter,
		html: rendered.html,
		headings: rendered.headings.length > 0 ? rendered.headings : note.headings,
		tags: rendered.tags.length > 0 ? rendered.tags : note.tags,
		links: links.map((link) => ({
			to: link.to,
			target: link.target,
			alias: link.alias ?? null,
			kind: link.kind,
		})),
		backlinks: backlinks.map((link) => ({
			from: link.from,
			fromTitle: index.notes.get(link.from)?.title ?? link.from,
			line: link.line,
			excerpt: excerptForLink(index, link),
		})),
		unresolvedTargets,
		modified: note.modified,
		size: note.size,
	};
}
