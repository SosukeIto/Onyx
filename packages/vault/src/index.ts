/**
 * Public API of @Onyx/vault.
 *
 * The signatures below are the contract consumed by apps/server and
 * packages/api. Implementations live in the sibling modules; until they land,
 * the functions throw so that callers type-check but fail loudly at runtime.
 */
import type { RenderedNote, SearchHit, VaultIndex } from "./types";

export * from "./types";

export interface BuildIndexOptions {
	/** Absolute path of the vault root (the git clone). */
	root: string;
	/** Commit hash the working tree is at. */
	commit: string;
	/** Optional last-modified dates per vault path (ISO 8601), e.g. from `git log`. */
	fileDates?: Map<string, string>;
}

/** Scan the vault directory and build the in-memory index. */
export function buildIndex(_options: BuildIndexOptions): Promise<VaultIndex> {
	throw new Error("@Onyx/vault: buildIndex is not implemented yet");
}

/**
 * Resolve a wikilink target the way Obsidian does: exact vault path first,
 * then unique basename, then the candidate closest to `fromPath`.
 * Returns the vault path of the note, or `null` if it does not exist.
 */
export function resolveLink(
	_index: VaultIndex,
	_fromPath: string,
	_target: string,
): string | null {
	throw new Error("@Onyx/vault: resolveLink is not implemented yet");
}

/** Resolve an embedded attachment (`![[image.png]]`) to a vault path, or `null`. */
export function resolveAttachment(
	_index: VaultIndex,
	_fromPath: string,
	_target: string,
): string | null {
	throw new Error("@Onyx/vault: resolveAttachment is not implemented yet");
}

export interface RenderOptions {
	/** Prefix for note links, default `/note/`. Path segments are URI-encoded and appended. */
	noteHref?: (path: string) => string;
	/** Prefix for attachment URLs, default `/files/`. */
	fileHref?: (path: string) => string;
}

/** Render a note's markdown body to sanitized HTML with Obsidian syntax support. */
export function renderNote(
	_index: VaultIndex,
	_path: string,
	_options?: RenderOptions,
): Promise<RenderedNote> {
	throw new Error("@Onyx/vault: renderNote is not implemented yet");
}

export interface SearchOptions {
	limit?: number;
	/** Restrict to notes under this folder (vault-relative). */
	folder?: string;
	tag?: string;
}

/** Case-insensitive substring search over titles and bodies. */
export function search(
	_index: VaultIndex,
	_query: string,
	_options?: SearchOptions,
): SearchHit[] {
	throw new Error("@Onyx/vault: search is not implemented yet");
}
