/**
 * Shared contract between the indexer (packages/vault), the server
 * (apps/server) and the API routers (packages/api).
 *
 * Everything here is derived from the git clone of the vault and is rebuilt
 * from scratch on every sync. Nothing is persisted (no database by design).
 *
 * Path conventions:
 * - `path` is always vault-relative, POSIX separators, includes the `.md`
 *   extension for notes (e.g. `01_Note/03_考え方/文章構成の型.md`).
 * - `basename` is the file name without extension (what `[[wikilink]]` uses).
 */

export type NoteFrontmatter = Record<string, unknown>;

export interface Heading {
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  /** Anchor id, generated with the same slug rules used by the renderer. */
  slug: string;
  /** 0-based line number in the source file. */
  line: number;
}

export type LinkKind = "wiki" | "embed" | "markdown";

export interface Link {
  /** Vault path of the note that contains the link. */
  from: string;
  /** Resolved vault path of the target, or `null` when the target does not exist. */
  to: string | null;
  /** Raw target as written, before resolution (e.g. `Daily Note`, `note#見出し`). */
  target: string;
  /** Display alias from `[[target|alias]]`, if any. */
  alias?: string;
  /** Heading fragment from `[[target#heading]]`, if any. */
  heading?: string;
  kind: LinkKind;
  /** 0-based line number in the source file. */
  line: number;
}

export interface Note {
  path: string;
  basename: string;
  /** Vault-relative folder (`""` for the root). */
  folder: string;
  /** `frontmatter.title` if present, otherwise `basename`. */
  title: string;
  frontmatter: NoteFrontmatter;
  /** Markdown body without the frontmatter block. */
  body: string;
  /**
   * 0-based line in the source file where `body` starts (i.e. the number
   * of frontmatter lines). Used to keep heading line numbers file-absolute.
   */
  bodyLine?: number;
  headings: Heading[];
  /** Tags from frontmatter `tags` and inline `#tag`, without the leading `#`, de-duplicated. */
  tags: string[];
  /** Outgoing links declared in this note. */
  links: Link[];
  /** Last commit date for this file (ISO 8601), or `null` if unknown. */
  modified: string | null;
  /** Size of the source file in bytes. */
  size: number;
}

/** Non-markdown files (images, PDFs, …) that notes may embed or link to. */
export interface Attachment {
  path: string;
  basename: string;
  folder: string;
  /** File extension without the dot, lower-cased (e.g. `png`, `pdf`). */
  ext: string;
  size: number;
}

export interface TreeFolder {
  kind: "folder";
  name: string;
  path: string;
  children: TreeNode[];
  /** Number of notes in this folder and all sub-folders. */
  noteCount: number;
}

export interface TreeFile {
  kind: "file";
  name: string;
  path: string;
  title: string;
}

export type TreeNode = TreeFolder | TreeFile;

export interface VaultIndex {
  /** Git commit hash the index was built from. */
  commit: string;
  /** ISO 8601 timestamp of when the index was built. */
  builtAt: string;
  notes: Map<string, Note>;
  attachments: Map<string, Attachment>;
  /** `basename` → vault paths (multiple when the same name exists in several folders). */
  byBasename: Map<string, string[]>;
  /** Attachment `basename.ext` → vault paths. */
  attachmentsByName: Map<string, string[]>;
  /** All links in the vault, resolved. */
  links: Link[];
  /** Target path → links pointing at it. */
  backlinks: Map<string, Link[]>;
  /** Unresolved link target (raw) → links using it. */
  unresolved: Map<string, Link[]>;
  /** tag → note paths. */
  tags: Map<string, string[]>;
  /** Folder tree rooted at the vault root (hidden folders such as `.obsidian` are excluded). */
  tree: TreeFolder;
}

export interface SearchHit {
  path: string;
  title: string;
  /** Number of matches in title + body. */
  count: number;
  /** Text fragments around matches; `ranges` are [start, end) offsets inside `text`. */
  snippets: Array<{ text: string; ranges: Array<[number, number]> }>;
}

export interface RenderedNote {
  /** Sanitized HTML of the body. */
  html: string;
  headings: Heading[];
  links: Link[];
  tags: string[];
}
