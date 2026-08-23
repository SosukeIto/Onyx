/**
 * Build the static vault bundle described by `./types`.
 *
 * Everything the web app needs at request time is produced here, once, on the
 * build machine: the manifest (tree, tags, graph, daily notes, Claude logs),
 * one JSON file per rendered note, the plain-text search index and the
 * attachments. The Workers runtime only serves files.
 *
 * The logic for backlink excerpts, the link graph, the daily-note convention
 * and the Claude-log facets used to live in the oRPC routers; it was moved
 * here when the request-time server was dropped.
 */
import { Buffer } from "node:buffer";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { buildIndex } from "../build";
import { renderNote } from "../markdown/render";
import { normalizeFrontmatterTags } from "../tags";
import { extname, plainText, plainTextBody } from "../text";
import type { Link, Note, VaultIndex } from "../types";
import type {
  AttachmentRef,
  Backlink,
  ClaudeLog,
  GraphEdge,
  GraphNode,
  NoteSummary,
  SearchDoc,
  StaticNote,
  VaultManifest,
} from "./types";
import { assetId, FILES_DIR, MANIFEST_PATH, NOTES_DIR, SEARCH_PATH } from "./types";

/** Attachment types the web app can actually display. */
export const ATTACHMENT_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "pdf",
  "mp3",
  "mp4",
  "webm",
]);

/** Folder that holds the `YYYY/MM/DD.md` daily notes. */
const DAILY_ROOT = "00_Daily";
const DAILY_PATH = new RegExp(`^${DAILY_ROOT}/(\\d{4})/(\\d{2})/(\\d{2})\\.md$`);

const EXCERPT_MAX = 160;

/** Tag every exported Claude Code conversation carries in its frontmatter. */
const CLAUDE_LOG_TAG = "claude-log";
/** `02_ClaudeLogs/projects/<name>/…` — the fallback source for `project`. */
const PROJECT_FROM_PATH = /^02_ClaudeLogs\/projects\/([^/]+)\//;

const UNRESOLVED_PREFIX = "unresolved:";

export interface BuildStaticBundleOptions {
  /** Absolute (or cwd-relative) path of the vault clone. */
  vaultDir: string;
  /** Directory the bundle is written into, e.g. `apps/web/public`. */
  outDir: string;
  /** Commit the vault clone is at. */
  commit: string;
  /** Branch the commit came from; recorded in the manifest. */
  branch: string;
  /** Last-commit dates per vault path (ISO 8601), from `git log`. */
  fileDates?: Map<string, string>;
}

export interface BuildStaticBundleResult {
  manifest: VaultManifest;
  noteCount: number;
  attachmentCount: number;
  /** Total size of everything written, in bytes. */
  bytes: number;
}

function directoryOf(assetPath: string): string {
  return assetPath.slice(0, assetPath.lastIndexOf("/"));
}

/** `/vault` — the parent of every JSON file the bundle emits. */
const VAULT_DIR = directoryOf(MANIFEST_PATH);

async function idsFor(paths: Iterable<string>): Promise<Map<string, string>> {
  const list = [...paths];
  const ids = await Promise.all(list.map((path) => assetId(path)));
  const byPath = new Map<string, string>();
  const byId = new Map<string, string>();
  for (let i = 0; i < list.length; i++) {
    const path = list[i];
    const id = ids[i];
    if (path === undefined || id === undefined) continue;
    const clash = byId.get(id);
    if (clash !== undefined) {
      throw new Error(`@Onyx/vault: asset id collision on ${id}: ${clash} and ${path}`);
    }
    byId.set(id, path);
    byPath.set(path, id);
  }
  return byPath;
}

function summarize(note: Note, id: string): NoteSummary {
  return {
    id,
    path: note.path,
    title: note.title,
    folder: note.folder,
    tags: note.tags,
    modified: note.modified,
    size: note.size,
  };
}

function condense(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > EXCERPT_MAX ? `${collapsed.slice(0, EXCERPT_MAX)}…` : collapsed;
}

/**
 * Plain-text excerpt of the source line a backlink sits on. `Link.line` is
 * file-absolute while `Note.body` has the frontmatter stripped, so the offset
 * is subtracted first; if that line no longer contains the target (a note
 * edited between index and render) the first line that does is used.
 */
function excerptForLink(index: VaultIndex, link: Link): string {
  const source = index.notes.get(link.from);
  if (!source) return "";

  const lines = source.body.split("\n");
  const reported = lines[link.line - (source.bodyLine ?? 0)];
  if (reported?.includes(link.target)) return condense(plainText(reported));

  const matched = lines.find((line) => line.includes(link.target));
  if (matched !== undefined) return condense(plainText(matched));

  return condense(plainText(reported ?? ""));
}

function backlinksFor(index: VaultIndex, path: string): Backlink[] {
  return (index.backlinks.get(path) ?? []).map((link) => ({
    from: link.from,
    fromTitle: index.notes.get(link.from)?.title ?? link.from,
    line: link.line,
    excerpt: excerptForLink(index, link),
  }));
}

/** Whole-vault graph: every note plus one node per unresolved link target. */
function buildGraph(index: VaultIndex): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes = new Map<string, GraphNode>();
  for (const [notePath, note] of index.notes) {
    nodes.set(notePath, {
      id: notePath,
      title: note.title,
      kind: "note",
      inDegree: 0,
    });
  }

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  for (const link of index.links) {
    if (!index.notes.has(link.from)) continue;

    let target: string;
    if (link.to === null) {
      target = `${UNRESOLVED_PREFIX}${link.target}`;
      if (!nodes.has(target)) {
        nodes.set(target, {
          id: target,
          title: link.target,
          kind: "unresolved",
          inDegree: 0,
        });
      }
    } else if (index.notes.has(link.to)) {
      target = link.to;
    } else {
      // Attachment embeds are not part of the note graph.
      continue;
    }

    if (target === link.from) continue;

    const key = `${link.from} -> ${target}`;
    if (seen.has(key)) continue;
    seen.add(key);

    edges.push({ source: link.from, target });
  }

  for (const edge of edges) {
    const node = nodes.get(edge.target);
    if (node) node.inDegree += 1;
  }

  return { nodes: [...nodes.values()], edges };
}

/** `00_Daily/YYYY/MM/DD.md` notes as `{ date, path }`, oldest first. */
function buildDaily(index: VaultIndex): Array<{ date: string; path: string }> {
  const days: Array<{ date: string; path: string }> = [];
  for (const notePath of index.notes.keys()) {
    const matched = DAILY_PATH.exec(notePath);
    if (!matched) continue;
    days.push({
      date: `${matched[1]}-${matched[2]}-${matched[3]}`,
      path: notePath,
    });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

/** YAML scalars we accept as text; anything else (lists, maps) is `null`. */
function text(value: unknown): string | null {
  if (typeof value === "string") return value.trim() === "" ? null : value.trim();
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
    project: text(note.frontmatter.project) ?? PROJECT_FROM_PATH.exec(note.path)?.[1] ?? null,
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

function countProjects(logs: ClaudeLog[]): Array<{ project: string; count: number }> {
  const counts = new Map<string, number>();
  for (const log of logs) {
    if (log.project === null) continue;
    counts.set(log.project, (counts.get(log.project) ?? 0) + 1);
  }
  return [...counts]
    .map(([project, count]) => ({ project, count }))
    .sort((a, b) => b.count - a.count || a.project.localeCompare(b.project));
}

function buildLogs(index: VaultIndex): VaultManifest["logs"] {
  const items = [...index.notes.values()].filter(isClaudeLog).map(toClaudeLog).sort(compareLogs);
  return { items, projects: countProjects(items) };
}

function buildTags(index: VaultIndex): VaultManifest["tags"] {
  return [...index.tags.entries()]
    .map(([tag, paths]) => ({ tag, count: paths.length }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function buildUnresolved(index: VaultIndex): VaultManifest["unresolved"] {
  return [...index.unresolved.entries()]
    .map(([target, links]) => ({
      target,
      count: links.length,
      from: [...new Set(links.map((link) => link.from))].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => b.count - a.count || a.target.localeCompare(b.target));
}

/**
 * Index the vault, render every note and write the whole bundle into
 * `outDir`. Only `outDir/vault` and `outDir/files` are removed first, so
 * hand-written public assets (favicons, manifests, …) survive a rebuild.
 */
export async function buildStaticBundle(
  options: BuildStaticBundleOptions,
): Promise<BuildStaticBundleResult> {
  const vaultDir = options.vaultDir.replace(/\/+$/, "");
  const outDir = options.outDir.replace(/\/+$/, "");

  const index = await buildIndex({
    root: vaultDir,
    commit: options.commit,
    fileDates: options.fileDates,
  });

  const noteIds = await idsFor(index.notes.keys());
  const attachmentIds = await idsFor(index.attachments.keys());

  /** `/files/<id>.<ext>` for attachments the bundle ships. */
  const fileUrl = (path: string): string => {
    const id = attachmentIds.get(path);
    if (id === undefined) return `${FILES_DIR}/${path}`;
    const ext = extname(path);
    return `${FILES_DIR}/${id}${ext === "" ? "" : `.${ext}`}`;
  };

  await rm(`${outDir}${VAULT_DIR}`, { recursive: true, force: true });
  await rm(`${outDir}${FILES_DIR}`, { recursive: true, force: true });
  await mkdir(`${outDir}${NOTES_DIR}`, { recursive: true });
  await mkdir(`${outDir}${FILES_DIR}`, { recursive: true });

  let bytes = 0;
  const write = async (absolute: string, json: unknown): Promise<void> => {
    const body = JSON.stringify(json);
    bytes += Buffer.byteLength(body, "utf8");
    await writeFile(absolute, body, "utf8");
  };

  // Notes ------------------------------------------------------------------
  const notes: Record<string, NoteSummary> = {};
  const docs: SearchDoc[] = [];

  for (const note of index.notes.values()) {
    const id = noteIds.get(note.path);
    if (id === undefined) continue;

    const rendered = await renderNote(index, note.path, { fileHref: fileUrl });
    const links = rendered.links.length > 0 ? rendered.links : note.links;
    const summary = summarize(note, id);

    const staticNote: StaticNote = {
      ...summary,
      tags: rendered.tags.length > 0 ? rendered.tags : note.tags,
      frontmatter: note.frontmatter,
      html: rendered.html,
      headings: rendered.headings.length > 0 ? rendered.headings : note.headings,
      links: links.map((link) => ({
        to: link.to,
        target: link.target,
        alias: link.alias,
        kind: link.kind,
      })),
      backlinks: backlinksFor(index, note.path),
      unresolvedTargets: [
        ...new Set(links.filter((link) => link.to === null).map((link) => link.target)),
      ],
    };

    await write(`${outDir}${NOTES_DIR}/${id}.json`, staticNote);
    notes[note.path] = summary;
    docs.push({
      path: note.path,
      title: note.title,
      text: plainTextBody(note.body),
      folder: note.folder,
      tags: note.tags,
    });
  }

  // Attachments ------------------------------------------------------------
  const attachments: Record<string, AttachmentRef> = {};
  for (const attachment of index.attachments.values()) {
    if (!ATTACHMENT_EXTENSIONS.has(attachment.ext)) continue;
    const id = attachmentIds.get(attachment.path);
    if (id === undefined) continue;

    const url = fileUrl(attachment.path);
    await copyFile(
      `${vaultDir}/${attachment.path}`,
      `${outDir}${FILES_DIR}/${id}.${attachment.ext}`,
    );
    bytes += attachment.size;
    attachments[attachment.path] = {
      id,
      path: attachment.path,
      ext: attachment.ext,
      size: attachment.size,
      url,
    };
  }

  // Manifest ---------------------------------------------------------------
  const manifest: VaultManifest = {
    commit: options.commit,
    builtAt: index.builtAt,
    branch: options.branch,
    noteCount: Object.keys(notes).length,
    attachmentCount: Object.keys(attachments).length,
    tree: index.tree,
    notes,
    attachments,
    tags: buildTags(index),
    unresolved: buildUnresolved(index),
    graph: buildGraph(index),
    daily: buildDaily(index),
    logs: buildLogs(index),
  };

  await write(`${outDir}${SEARCH_PATH}`, docs);
  await write(`${outDir}${MANIFEST_PATH}`, manifest);

  return {
    manifest,
    noteCount: manifest.noteCount,
    attachmentCount: manifest.attachmentCount,
    bytes,
  };
}
