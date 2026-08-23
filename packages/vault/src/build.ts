import { readFile } from "node:fs/promises";
import { parseFrontmatter, resolveTitle } from "./frontmatter";
import { extractHeadings } from "./headings";
import { extractLinks, resolveAttachment, resolveLink } from "./links";
import { scanVault } from "./scan";
import { collectTags } from "./tags";
import { basename, dirname, extname } from "./text";
import { buildTree } from "./tree";
import type { Attachment, Link, Note, VaultIndex } from "./types";

export interface BuildIndexOptions {
	/** Absolute path of the vault root (the git clone). */
	root: string;
	/** Commit hash the working tree is at. */
	commit: string;
	/** Optional last-modified dates per vault path (ISO 8601), e.g. `git log`. */
	fileDates?: Map<string, string>;
}

function push(map: Map<string, string[]>, key: string, value: string): void {
	const bucket = map.get(key);
	if (bucket) bucket.push(value);
	else map.set(key, [value]);
}

/**
 * Scan the vault directory and build the in-memory index: notes, links,
 * backlinks, tags and the folder tree. Nothing is persisted — the whole
 * index is rebuilt on every sync.
 */
export async function buildIndex(
	options: BuildIndexOptions,
): Promise<VaultIndex> {
	const root = options.root.replace(/\/+$/, "");
	const scanned = scanVault(root);

	const notes = new Map<string, Note>();
	const attachments = new Map<string, Attachment>();
	const byBasename = new Map<string, string[]>();
	const attachmentsByName = new Map<string, string[]>();

	for (const file of scanned.attachments) {
		const name = basename(file.path);
		const attachment: Attachment = {
			path: file.path,
			basename: basename(file.path, true),
			folder: dirname(file.path),
			ext: extname(file.path),
			size: file.size,
		};
		attachments.set(file.path, attachment);
		push(attachmentsByName, name, file.path);
	}

	const contents = await Promise.all(
		scanned.notes.map(async (file) => {
			try {
				return await readFile(`${root}/${file.path}`, "utf8");
			} catch {
				return "";
			}
		}),
	);

	for (let i = 0; i < scanned.notes.length; i++) {
		const file = scanned.notes[i];
		if (!file) continue;
		const content = contents[i] ?? "";
		const { frontmatter, body, bodyLine } = parseFrontmatter(content);
		const name = basename(file.path, true);
		const note: Note = {
			path: file.path,
			basename: name,
			folder: dirname(file.path),
			title: resolveTitle(frontmatter, name),
			frontmatter,
			body,
			bodyLine,
			headings: extractHeadings(body, bodyLine),
			tags: collectTags(frontmatter, body),
			links: extractLinks(file.path, body, bodyLine),
			modified: options.fileDates?.get(file.path) ?? null,
			size: file.size,
		};
		notes.set(file.path, note);
		push(byBasename, name, file.path);
	}

	const index: VaultIndex = {
		commit: options.commit,
		builtAt: new Date().toISOString(),
		notes,
		attachments,
		byBasename,
		attachmentsByName,
		links: [],
		backlinks: new Map(),
		unresolved: new Map(),
		tags: new Map(),
		tree: buildTree(notes),
	};

	const links: Link[] = [];
	for (const note of notes.values()) {
		for (const link of note.links) {
			const ext = extname(link.target);
			const isAttachment = link.kind === "embed" && ext !== "" && ext !== "md";
			link.to = isAttachment
				? resolveAttachment(index, note.path, link.target)
				: resolveLink(index, note.path, link.target);
			links.push(link);
			if (link.to === null) {
				push2(index.unresolved, link.target, link);
			} else if (link.to !== note.path) {
				push2(index.backlinks, link.to, link);
			}
		}
		for (const tag of note.tags) push(index.tags, tag, note.path);
	}
	index.links = links;

	return index;
}

function push2(map: Map<string, Link[]>, key: string, value: Link): void {
	const bucket = map.get(key);
	if (bucket) bucket.push(value);
	else map.set(key, [value]);
}
