/**
 * Static vault bundle — the contract between the build step
 * (`scripts/build-vault.ts`, run in GitHub Actions) and the web app
 * (TanStack Start on Cloudflare Workers).
 *
 * Nothing runs git or indexes at request time. The build step indexes the
 * vault with `@Onyx/vault`, renders every note to HTML and writes these JSON
 * files plus the attachments into `apps/web/public/`, which Wrangler uploads
 * as Workers static assets:
 *
 *   /vault/manifest.json          VaultManifest
 *   /vault/notes/<id>.json        StaticNote  (one per note)
 *   /vault/search.json            SearchDoc[] (plain text, client-side search)
 *   /files/<id>.<ext>             attachments
 *
 * `id` is the first 16 hex chars of SHA-1 over the vault path (UTF-8), so
 * asset file names stay ASCII regardless of the Japanese/space-laden vault
 * paths. The manifest maps paths to ids.
 */
import type { Heading, Link, TreeFolder } from "../types";

export const MANIFEST_PATH = "/vault/manifest.json";
export const SEARCH_PATH = "/vault/search.json";
export const NOTES_DIR = "/vault/notes";
export const FILES_DIR = "/files";

export interface NoteSummary {
	id: string;
	path: string;
	title: string;
	folder: string;
	tags: string[];
	/** ISO 8601 or null when git has no history for the file. */
	modified: string | null;
	size: number;
}

export interface AttachmentRef {
	id: string;
	path: string;
	ext: string;
	size: number;
	/** URL of the uploaded asset, e.g. `/files/3f2a9c....png`. */
	url: string;
}

export interface GraphNode {
	id: string;
	title: string;
	kind: "note" | "unresolved";
	inDegree: number;
}

export interface GraphEdge {
	source: string;
	target: string;
}

export interface ClaudeLog {
	path: string;
	title: string;
	date: string | null;
	created: string | null;
	project: string | null;
	sessionId: string | null;
}

export interface VaultManifest {
	/** Commit of the vault the bundle was built from. */
	commit: string;
	/** ISO 8601 build time. */
	builtAt: string;
	branch: string;
	noteCount: number;
	attachmentCount: number;
	tree: TreeFolder;
	/** Every note, keyed by vault path. */
	notes: Record<string, NoteSummary>;
	/** Every attachment, keyed by vault path. */
	attachments: Record<string, AttachmentRef>;
	tags: Array<{ tag: string; count: number }>;
	unresolved: Array<{ target: string; count: number; from: string[] }>;
	graph: { nodes: GraphNode[]; edges: GraphEdge[] };
	/** `00_Daily/YYYY/MM/DD.md` notes as `{ date: "YYYY-MM-DD", path }`, ascending. */
	daily: Array<{ date: string; path: string }>;
	/** `claude-log` notes, newest first, plus the project facet. */
	logs: {
		items: ClaudeLog[];
		projects: Array<{ project: string; count: number }>;
	};
}

export interface Backlink {
	from: string;
	fromTitle: string;
	line: number;
	/** Plain-text excerpt of the line that links here. */
	excerpt: string;
}

export interface StaticNote extends NoteSummary {
	frontmatter: Record<string, unknown>;
	/** Sanitized HTML; note links point at `/note/<encoded path>`, images at `/files/<id>.<ext>`. */
	html: string;
	headings: Heading[];
	links: Array<Pick<Link, "to" | "target" | "alias" | "kind">>;
	backlinks: Backlink[];
	unresolvedTargets: string[];
}

export interface SearchDoc {
	path: string;
	title: string;
	/** Plain text of the body (markdown syntax stripped, whitespace collapsed). */
	text: string;
}

/** Stable ASCII id for a vault path. */
export async function assetId(path: string): Promise<string> {
	const bytes = new TextEncoder().encode(path);
	const digest = await crypto.subtle.digest("SHA-1", bytes);
	return Array.from(new Uint8Array(digest).slice(0, 8), (b) =>
		b.toString(16).padStart(2, "0"),
	).join("");
}

export function noteAssetPath(id: string): string {
	return `${NOTES_DIR}/${id}.json`;
}
