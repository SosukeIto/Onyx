import {
	basename,
	dirname,
	extname,
	fold,
	joinPath,
	maskCode,
	splitLines,
} from "./text";
import type { Link, VaultIndex } from "./types";

/** `[[target]]`, `[[target|alias]]`, `[[target#heading]]` and `![[embed]]`. */
const WIKILINK = /(!?)\[\[([^[\]\n]*)\]\]/g;
/** `[text](target)` / `![alt](target)` with an optional `"title"`. */
const MARKDOWN_LINK =
	/(!?)\[([^\]\n]*)\]\(\s*<?([^)<>\s]*)>?(?:\s+["'(][^)\n]*)?\s*\)/g;

const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export interface WikilinkParts {
	target: string;
	alias?: string;
	heading?: string;
}

/** Split the inside of a `[[…]]` into target / heading / alias. */
export function parseWikilink(inner: string): WikilinkParts | null {
	const raw = inner.trim();
	if (raw === "") return null;
	let rest = raw;
	let alias: string | undefined;
	const bar = rest.indexOf("|");
	if (bar !== -1) {
		alias = rest.slice(bar + 1).trim();
		rest = rest.slice(0, bar).trim();
	}
	let heading: string | undefined;
	const hash = rest.indexOf("#");
	if (hash !== -1) {
		heading = rest.slice(hash + 1).trim();
		rest = rest.slice(0, hash).trim();
	}
	if (rest === "" && heading === undefined) return null;
	const parts: WikilinkParts = { target: rest };
	if (alias) parts.alias = alias;
	if (heading) parts.heading = heading;
	return parts;
}

function decode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

/**
 * Extract every outgoing link of a note. Code fences and inline code spans
 * are masked out first so that `[[…]]` inside a snippet is not a link.
 *
 * `to` is left `null` here; resolution happens once the whole vault is known.
 */
export function extractLinks(
	fromPath: string,
	body: string,
	lineOffset = 0,
): Link[] {
	const lines = maskCode(splitLines(body));
	const links: Link[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		const lineNumber = i + lineOffset;

		WIKILINK.lastIndex = 0;
		let wiki = WIKILINK.exec(line);
		while (wiki !== null) {
			const parts = parseWikilink(wiki[2] ?? "");
			if (parts) {
				const link: Link = {
					from: fromPath,
					to: null,
					target: parts.target,
					kind: wiki[1] === "!" ? "embed" : "wiki",
					line: lineNumber,
				};
				if (parts.alias) link.alias = parts.alias;
				if (parts.heading) link.heading = parts.heading;
				links.push(link);
			}
			wiki = WIKILINK.exec(line);
		}

		MARKDOWN_LINK.lastIndex = 0;
		let md = MARKDOWN_LINK.exec(line);
		while (md !== null) {
			const url = (md[3] ?? "").trim();
			const skip = url === "" || ABSOLUTE.test(url) || url.startsWith("#");
			if (!skip) {
				const hash = url.indexOf("#");
				const target = decode(hash === -1 ? url : url.slice(0, hash));
				const heading = hash === -1 ? "" : decode(url.slice(hash + 1));
				const link: Link = {
					from: fromPath,
					to: null,
					target,
					kind: md[1] === "!" ? "embed" : "markdown",
					line: lineNumber,
				};
				const text = (md[2] ?? "").trim();
				if (text) link.alias = text;
				if (heading) link.heading = heading;
				links.push(link);
			}
			md = MARKDOWN_LINK.exec(line);
		}
	}
	return links;
}

interface Derived {
	notePathByFold: Map<string, string>;
	notesByBasenameFold: Map<string, string[]>;
	attachmentPathByFold: Map<string, string>;
	attachmentsByNameFold: Map<string, string[]>;
}

const derivedCache = new WeakMap<VaultIndex, Derived>();

function derived(index: VaultIndex): Derived {
	const cached = derivedCache.get(index);
	if (cached) return cached;
	const value: Derived = {
		notePathByFold: new Map(),
		notesByBasenameFold: new Map(),
		attachmentPathByFold: new Map(),
		attachmentsByNameFold: new Map(),
	};
	for (const path of index.notes.keys()) {
		const key = fold(path);
		if (!value.notePathByFold.has(key)) value.notePathByFold.set(key, path);
		const name = fold(basename(path, true));
		const bucket = value.notesByBasenameFold.get(name);
		if (bucket) bucket.push(path);
		else value.notesByBasenameFold.set(name, [path]);
	}
	for (const path of index.attachments.keys()) {
		const key = fold(path);
		if (!value.attachmentPathByFold.has(key)) {
			value.attachmentPathByFold.set(key, path);
		}
		const name = fold(basename(path));
		const bucket = value.attachmentsByNameFold.get(name);
		if (bucket) bucket.push(path);
		else value.attachmentsByNameFold.set(name, [path]);
	}
	derivedCache.set(index, value);
	return value;
}

/** Number of leading path segments shared by two vault paths. */
function sharedDepth(a: string, b: string): number {
	const left = a.split("/");
	const right = b.split("/");
	let n = 0;
	while (n < left.length - 1 && n < right.length - 1 && left[n] === right[n]) {
		n++;
	}
	return n;
}

/** Obsidian's "closest note wins" tie-break. */
function pickClosest(candidates: string[], fromPath: string): string | null {
	let best: string | null = null;
	let bestDepth = -1;
	for (const candidate of candidates) {
		const depth = sharedDepth(fromPath, candidate);
		if (
			depth > bestDepth ||
			(depth === bestDepth &&
				best !== null &&
				(candidate.split("/").length < best.split("/").length ||
					(candidate.split("/").length === best.split("/").length &&
						candidate < best)))
		) {
			best = candidate;
			bestDepth = depth;
		}
	}
	return best;
}

function stripTargetDecorations(target: string): string {
	let value = target.trim();
	const bar = value.indexOf("|");
	if (bar !== -1) value = value.slice(0, bar).trim();
	const hash = value.indexOf("#");
	if (hash !== -1) value = value.slice(0, hash).trim();
	return value;
}

/**
 * Resolve a wikilink target the way Obsidian does: exact vault path first,
 * then a unique basename, then the candidate closest to `fromPath`.
 */
export function resolveLink(
	index: VaultIndex,
	fromPath: string,
	target: string,
): string | null {
	const hadHeading = target.includes("#");
	const cleaned = stripTargetDecorations(target);
	if (cleaned === "") {
		return hadHeading && index.notes.has(fromPath) ? fromPath : null;
	}

	const maps = derived(index);
	const folder = dirname(fromPath);
	const candidates: string[] = [];
	const push = (value: string): void => {
		if (value && !candidates.includes(value)) candidates.push(value);
	};

	const withExtension = extname(cleaned) === "md" ? cleaned : `${cleaned}.md`;
	push(cleaned);
	push(withExtension);
	if (/^\.{1,2}\//.test(cleaned) || cleaned.includes("/")) {
		push(joinPath(folder, cleaned));
		push(joinPath(folder, withExtension));
	}

	for (const candidate of candidates) {
		if (index.notes.has(candidate)) return candidate;
	}
	for (const candidate of candidates) {
		const hit = maps.notePathByFold.get(fold(candidate));
		if (hit) return hit;
	}

	if (cleaned.includes("/")) {
		const suffix = `/${fold(withExtension)}`;
		const matches: string[] = [];
		for (const path of index.notes.keys()) {
			if (fold(path).endsWith(suffix)) matches.push(path);
		}
		if (matches.length > 0) return pickClosest(matches, fromPath);
	}

	const byName = maps.notesByBasenameFold.get(fold(basename(cleaned, true)));
	if (byName && byName.length > 0) {
		if (byName.length === 1) return byName[0] ?? null;
		return pickClosest(byName, fromPath);
	}
	return null;
}

/** Resolve `![[image.png]]`: same folder, then `attachments/`, then by name. */
export function resolveAttachment(
	index: VaultIndex,
	fromPath: string,
	target: string,
): string | null {
	let cleaned = target.trim();
	const bar = cleaned.indexOf("|");
	if (bar !== -1) cleaned = cleaned.slice(0, bar).trim();
	cleaned = decode(cleaned).replace(/^\.\//, "");
	if (cleaned === "") return null;

	const maps = derived(index);
	const folder = dirname(fromPath);
	const candidates: string[] = [];
	const push = (value: string): void => {
		if (value && !candidates.includes(value)) candidates.push(value);
	};

	push(joinPath(folder, cleaned));
	const segments = folder ? folder.split("/") : [];
	for (let i = segments.length; i >= 0; i--) {
		const prefix = segments.slice(0, i).join("/");
		push(joinPath(prefix, `attachments/${cleaned}`));
	}
	push(cleaned);

	for (const candidate of candidates) {
		if (index.attachments.has(candidate)) return candidate;
	}
	for (const candidate of candidates) {
		const hit = maps.attachmentPathByFold.get(fold(candidate));
		if (hit) return hit;
	}

	const byName = maps.attachmentsByNameFold.get(fold(basename(cleaned)));
	if (byName && byName.length > 0) {
		if (byName.length === 1) return byName[0] ?? null;
		return pickClosest(byName, fromPath);
	}
	return null;
}
