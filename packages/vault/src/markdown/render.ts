import type { Element, ElementContent, Root as HastRoot } from "hast";
import type { Root as MdastRoot } from "mdast";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { Heading, RenderedNote, VaultIndex } from "../types";
import { preprocess } from "./preprocess";
import { type ObsidianOptions, remarkObsidian } from "./remark-obsidian";
import { sanitizeSchema } from "./sanitize";

export interface RenderOptions {
	/** Prefix for note links, default `/note/`. Path segments are URI-encoded. */
	noteHref?: (path: string) => string;
	/** Prefix for attachment URLs, default `/files/`. */
	fileHref?: (path: string) => string;
}

function encodePath(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

/** `/note/01_Note/…` with the `.md` extension dropped. */
export const defaultNoteHref = (path: string): string =>
	`/note/${encodePath(path.replace(/\.md$/i, ""))}`;

/** `/files/01_Note/…/image.png` */
export const defaultFileHref = (path: string): string =>
	`/files/${encodePath(path)}`;

const MAX_EMBED_DEPTH = 1;

/**
 * Notes mix prose and `$` signs freely, so KaTeX must never throw and must
 * stay quiet about "unicode text in math mode" (every Japanese formula hits
 * that warning).
 */
const KATEX_OPTIONS = {
	strict: "ignore",
	throwOnError: false,
	output: "htmlAndMathml",
} as const;

function baseProcessor(options: ObsidianOptions) {
	return unified()
		.use(remarkParse)
		.use(remarkCjkFriendly)
		.use(remarkGfm)
		.use(remarkFrontmatter, ["yaml", "toml"])
		.use(remarkMath)
		.use(remarkObsidian, options);
}

function obsidianOptions(
	index: VaultIndex,
	fromPath: string,
	noteHref: (path: string) => string,
	fileHref: (path: string) => string,
	depth: number,
): ObsidianOptions {
	return {
		index,
		fromPath,
		noteHref,
		fileHref,
		renderEmbed:
			depth >= MAX_EMBED_DEPTH
				? null
				: (path: string) => {
						const note = index.notes.get(path);
						if (!note) return [];
						return toHast(
							index,
							path,
							note.body,
							noteHref,
							fileHref,
							depth + 1,
						);
					},
	};
}

/** Markdown → hast, without the document-level rehype passes. */
function toHast(
	index: VaultIndex,
	fromPath: string,
	body: string,
	noteHref: (path: string) => string,
	fileHref: (path: string) => string,
	depth: number,
): ElementContent[] {
	const processor = baseProcessor(
		obsidianOptions(index, fromPath, noteHref, fileHref, depth),
	).use(remarkRehype);
	const mdast = processor.parse(preprocess(body)) as MdastRoot;
	const hast = processor.runSync(mdast) as unknown as HastRoot;
	return hast.children as ElementContent[];
}

function textOf(node: unknown): string {
	if (node === null || typeof node !== "object") return "";
	const candidate = node as {
		type?: string;
		value?: string;
		children?: unknown[];
	};
	if (candidate.type === "text" && typeof candidate.value === "string") {
		return candidate.value;
	}
	if (Array.isArray(candidate.children)) {
		return candidate.children.map(textOf).join("");
	}
	return "";
}

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function collectHeadings(root: HastRoot, lineOffset: number): Heading[] {
	const headings: Heading[] = [];
	const walk = (node: HastRoot | ElementContent): void => {
		if (node.type === "element" && HEADING_TAGS.has(node.tagName)) {
			const element: Element = node;
			const id = element.properties?.id;
			headings.push({
				depth: Number(element.tagName.slice(1)) as Heading["depth"],
				text: textOf(element).trim(),
				slug: typeof id === "string" ? id : "",
				line: (element.position?.start.line ?? 1) - 1 + lineOffset,
			});
			return;
		}
		if ("children" in node) {
			for (const child of node.children) walk(child as ElementContent);
		}
	};
	walk(root);
	return headings;
}

/**
 * Render a note's markdown body to sanitized HTML with Obsidian syntax
 * support. Embedded notes (`![[note]]`) are inlined exactly one level deep.
 */
export function renderBody(
	index: VaultIndex,
	path: string,
	body: string,
	options: RenderOptions = {},
	lineOffset = 0,
): { html: string; headings: Heading[] } {
	const noteHref = options.noteHref ?? defaultNoteHref;
	const fileHref = options.fileHref ?? defaultFileHref;
	const processor = baseProcessor(
		obsidianOptions(index, path, noteHref, fileHref, 0),
	)
		.use(remarkRehype)
		.use(rehypeSlug)
		.use(rehypeKatex, KATEX_OPTIONS)
		.use(rehypeSanitize, sanitizeSchema)
		.use(rehypeStringify);
	const mdast = processor.parse(preprocess(body)) as MdastRoot;
	const hast = processor.runSync(mdast) as unknown as HastRoot;
	return {
		html: processor.stringify(hast as never),
		headings: collectHeadings(hast, lineOffset),
	};
}

/** Public `renderNote`: looks the note up in the index and renders it. */
export async function renderNote(
	index: VaultIndex,
	path: string,
	options: RenderOptions = {},
): Promise<RenderedNote> {
	const note = index.notes.get(path);
	if (!note) throw new Error(`@Onyx/vault: note not found: ${path}`);
	const { html, headings } = renderBody(
		index,
		path,
		note.body,
		options,
		note.bodyLine ?? 0,
	);
	return { html, headings, links: note.links, tags: note.tags };
}
