import { maskCode, splitLines } from "./text";
import type { NoteFrontmatter } from "./types";

/**
 * `#tag` in running text. Obsidian requires at least one non-numeric
 * character, allows `/` for nesting and accepts any unicode letter, so
 * Japanese tags work out of the box.
 */
const INLINE_TAG =
	/(^|[\s()[\]{}"'、。，．「」『』【】（）：;:,>|])#([\p{L}\p{N}_/-]+)/gu;

function isTagLike(value: string): boolean {
	return /[\p{L}]/u.test(value);
}

function cleanTag(value: string): string {
	return value
		.trim()
		.replace(/^#+/, "")
		.replace(/^\/+|\/+$/g, "")
		.trim();
}

/** Accept `tags: [a, b]`, `tags: a`, `tags: "a, b"` and `tags: "a b"`. */
export function normalizeFrontmatterTags(value: unknown): string[] {
	const out: string[] = [];
	const push = (candidate: unknown): void => {
		if (candidate === null || candidate === undefined) return;
		if (Array.isArray(candidate)) {
			for (const item of candidate) push(item);
			return;
		}
		if (typeof candidate === "number" || typeof candidate === "boolean") {
			const tag = cleanTag(String(candidate));
			if (tag) out.push(tag);
			return;
		}
		if (typeof candidate !== "string") return;
		for (const part of candidate.split(/[,\s]+/)) {
			const tag = cleanTag(part);
			if (tag) out.push(tag);
		}
	};
	push(value);
	return out;
}

/** `#tag` occurrences in the body, ignoring code and heading markers. */
export function extractInlineTags(body: string): string[] {
	const lines = maskCode(splitLines(body));
	const out: string[] = [];
	for (const line of lines) {
		INLINE_TAG.lastIndex = 0;
		let match = INLINE_TAG.exec(line);
		while (match !== null) {
			const raw = match[2] ?? "";
			const tag = cleanTag(raw);
			if (tag && isTagLike(tag)) out.push(tag);
			match = INLINE_TAG.exec(line);
		}
	}
	return out;
}

/** Frontmatter tags plus inline tags, de-duplicated, order preserved. */
export function collectTags(
	frontmatter: NoteFrontmatter,
	body: string,
): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	const add = (tag: string): void => {
		const key = tag.toLowerCase();
		if (seen.has(key)) return;
		seen.add(key);
		out.push(tag);
	};
	for (const tag of normalizeFrontmatterTags(frontmatter.tags)) add(tag);
	for (const tag of normalizeFrontmatterTags(frontmatter.tag)) add(tag);
	for (const tag of extractInlineTags(body)) add(tag);
	return out;
}
