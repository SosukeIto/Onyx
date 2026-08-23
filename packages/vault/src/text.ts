/**
 * Small text helpers shared by the line-based scanners (headings, tags,
 * links). They all work on the *body* of a note (frontmatter already
 * stripped) and preserve line and column offsets so that reported line
 * numbers stay accurate.
 */

/** Split a document into lines without keeping the line terminators. */
export function splitLines(text: string): string[] {
	return text.split(/\r\n|\r|\n/);
}

/** Normalize for case-insensitive comparison (NFC + lower case). */
export function fold(value: string): string {
	return value.normalize("NFC").toLowerCase();
}

/** POSIX `dirname` for vault-relative paths (`""` for root-level files). */
export function dirname(path: string): string {
	const i = path.lastIndexOf("/");
	return i === -1 ? "" : path.slice(0, i);
}

/** POSIX `basename`, optionally without its extension. */
export function basename(path: string, stripExt = false): string {
	const i = path.lastIndexOf("/");
	const name = i === -1 ? path : path.slice(i + 1);
	if (!stripExt) return name;
	const dot = name.lastIndexOf(".");
	return dot <= 0 ? name : name.slice(0, dot);
}

/** Lower-cased extension without the dot (`""` when there is none). */
export function extname(path: string): string {
	const name = basename(path);
	const dot = name.lastIndexOf(".");
	return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/** Join a folder with a possibly relative path, resolving `.` and `..`. */
export function joinPath(folder: string, relative: string): string {
	const segments = folder ? folder.split("/") : [];
	for (const part of relative.split("/")) {
		if (part === "" || part === ".") continue;
		if (part === "..") {
			segments.pop();
			continue;
		}
		segments.push(part);
	}
	return segments.join("/");
}

/** `true` for every line that sits inside (or is) a fenced code block. */
export function fencedCodeLines(lines: string[]): boolean[] {
	const flags: boolean[] = new Array(lines.length).fill(false);
	let fence: string | null = null;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		const trimmed = line.trimStart();
		if (fence === null) {
			const open = /^(`{3,}|~{3,})/.exec(trimmed);
			if (open?.[1]) {
				fence = open[1];
				flags[i] = true;
			}
			continue;
		}
		flags[i] = true;
		if (
			trimmed.startsWith(fence) &&
			trimmed.slice(fence.length).trim() === ""
		) {
			fence = null;
		}
	}
	return flags;
}

/**
 * Blank out every character that lives inside code (fenced blocks and inline
 * code spans) while keeping the string length — and therefore every offset —
 * untouched.
 */
export function maskCode(lines: string[]): string[] {
	const fenced = fencedCodeLines(lines);
	return lines.map((line, i) =>
		fenced[i] ? " ".repeat(line.length) : maskInlineCode(line),
	);
}

function maskInlineCode(line: string): string {
	if (!line.includes("`")) return line;
	let result = "";
	let i = 0;
	while (i < line.length) {
		if (line.charAt(i) !== "`") {
			result += line.charAt(i);
			i++;
			continue;
		}
		let run = 0;
		while (i + run < line.length && line.charAt(i + run) === "`") run++;
		const end = findClosingRun(line, i + run, run);
		if (end === -1) {
			result += "`".repeat(run);
			i += run;
			continue;
		}
		result += " ".repeat(end + run - i);
		i = end + run;
	}
	return result;
}

function findClosingRun(line: string, from: number, size: number): number {
	let i = from;
	while (i < line.length) {
		if (line.charAt(i) !== "`") {
			i++;
			continue;
		}
		let run = 0;
		while (i + run < line.length && line.charAt(i + run) === "`") run++;
		if (run === size) return i;
		i += run;
	}
	return -1;
}

/** `[[target|alias]]` / `[[target#heading]]` → the text a reader sees. */
function wikiLinkText(inner: string): string {
	const bar = inner.indexOf("|");
	if (bar !== -1) return inner.slice(bar + 1);
	const hash = inner.indexOf("#");
	if (hash === -1) return inner;
	if (hash === 0) return inner.slice(1);
	return `${inner.slice(0, hash)} ${inner.slice(hash + 1)}`;
}

/** `![[file|300]]` → `file`: the size/alias part of an embed is not text. */
function embedText(inner: string): string {
	const bar = inner.indexOf("|");
	const target = bar === -1 ? inner : inner.slice(0, bar);
	const hash = target.indexOf("#");
	return hash === -1 ? target : target.replace("#", " ");
}

/**
 * Strip the inline markup of a single fragment (no block context). Shared by
 * `plainText` and `plainTextBody`; the ordering matters, wiki links have to
 * go before the `[text](url)` rule and every bracket rule before emphasis.
 */
function stripInline(value: string): string {
	return (
		value
			// Templater expressions and Obsidian comments carry no reader text.
			.replace(/<%[\s\S]*?%>/g, " ")
			.replace(/%%[\s\S]*?%%/g, " ")
			.replace(/!\[\[([^\]]*)\]\]/g, (_m, inner: string) => embedText(inner))
			.replace(/\[\[([^\]]*)\]\]/g, (_m, inner: string) => wikiLinkText(inner))
			.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
			.replace(/\[\^[^\]]*\]/g, " ")
			.replace(/!?\[([^\]]*)\]\[[^\]]*\]/g, "$1")
			// `<https://…>` is an autolink, everything else angled is HTML.
			.replace(/<(https?:\/\/[^\s>]+)>/g, "$1")
			.replace(/<\/?[A-Za-z][^>]*>/g, " ")
			.replace(/`+([^`]*)`+/g, "$1")
			.replace(/\*\*|__|~~|==/g, "")
			.replace(/\*([^*\n]+)\*/g, "$1")
			.replace(/(^|[\s(])_(\S(?:[^_]*\S)?)_(?=[\s).,!?]|$)/g, "$1$2")
	);
}

/**
 * Reduce a markdown fragment to its plain text: enough to derive heading
 * slugs and link display text without running the full parser.
 */
export function plainText(markdown: string): string {
	return stripInline(markdown).trim();
}

/** `---`, `***`, `___` on their own line. */
const THEMATIC_BREAK = /^(?:-{3,}|\*{3,}|_{3,})$/;
/** `| --- | :--: |` — the row that separates a table head from its body. */
const TABLE_DELIMITER = /^\|?[\s:|-]*-[\s:|-]*\|?$/;

/** Leading `>` quote markers, list bullets, task boxes and heading hashes. */
function stripBlockMarkers(line: string): string {
	let value = line.replace(/^\s+/, "");
	while (value.startsWith(">")) value = value.slice(1).replace(/^\s+/, "");
	value = value.replace(/^\[![^\]]*\][+-]?\s*/, "");
	value = value.replace(/^(?:[-*+]|\d+[.)])\s+/, "");
	value = value.replace(/^\[[ xX/-]\]\s*/, "");
	value = value.replace(/^#{1,6}\s+/, "").replace(/\s+#+\s*$/, "");
	if (value.startsWith("|")) {
		value = value
			.replace(/^\|/, "")
			.replace(/\|\s*$/, "")
			.replaceAll("|", " ");
	}
	return value;
}

/**
 * Turn a whole note body into the text a reader actually sees: markup
 * removed, the words it decorated kept, all whitespace collapsed to single
 * spaces. Used as the search haystack so snippets never leak `#`, `[[…]]`
 * or `**` into the UI.
 *
 * Code keeps its content (only the fences and backticks go) because code is
 * searchable text too; the frontmatter is expected to be stripped already.
 */
export function plainTextBody(markdown: string): string {
	const out: string[] = [];
	let fence: string | null = null;
	let inComment = false;

	for (const line of splitLines(markdown)) {
		const trimmed = line.trim();

		if (fence !== null) {
			if (
				trimmed.startsWith(fence) &&
				trimmed.slice(fence.length).trim() === ""
			) {
				fence = null;
			} else {
				out.push(line);
			}
			continue;
		}

		const open = /^(`{3,}|~{3,})/.exec(trimmed);
		if (open?.[1]) {
			fence = open[1];
			continue;
		}
		if (trimmed === "%%") {
			inComment = !inComment;
			continue;
		}
		if (inComment) continue;
		if (trimmed === "" || THEMATIC_BREAK.test(trimmed)) continue;
		if (trimmed.includes("|") && TABLE_DELIMITER.test(trimmed)) continue;

		out.push(stripInline(stripBlockMarkers(line)));
	}

	return out.join(" ").replace(/\s+/g, " ").trim();
}
