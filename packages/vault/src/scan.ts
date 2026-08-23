import { type Dirent, readdirSync, statSync } from "node:fs";
import { extname } from "./text";

export interface ScannedFile {
  /** Vault-relative POSIX path. */
  path: string;
  size: number;
}

export interface ScanResult {
  notes: ScannedFile[];
  attachments: ScannedFile[];
}

/**
 * Directories that never contain vault content. Everything starting with a
 * dot is skipped anyway; the list is kept for readability.
 */
const IGNORED_DIRECTORIES = new Set([".obsidian", ".git", ".vscode", ".trash", "node_modules"]);

const IGNORED_FILES = new Set([".gitkeep", ".DS_Store"]);

/**
 * Walk the vault root and split every file into notes (`.md`) and
 * attachments (everything else). File names are kept byte-for-byte as they
 * appear on disk; normalization only happens when names are compared.
 */
export function scanVault(root: string): ScanResult {
  const notes: ScannedFile[] = [];
  const attachments: ScannedFile[] = [];
  walk(root, "", notes, attachments);
  notes.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  attachments.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { notes, attachments };
}

function readEntries(directory: string): Dirent[] {
  try {
    return readdirSync(directory, { withFileTypes: true, encoding: "utf8" });
  } catch {
    return [];
  }
}

function walk(
  root: string,
  relative: string,
  notes: ScannedFile[],
  attachments: ScannedFile[],
): void {
  const absolute = relative ? `${root}/${relative}` : root;
  for (const entry of readEntries(absolute)) {
    const name = entry.name;
    if (name.startsWith(".")) continue;
    if (IGNORED_DIRECTORIES.has(name)) continue;
    if (IGNORED_FILES.has(name)) continue;
    const path = relative ? `${relative}/${name}` : name;
    if (entry.isDirectory()) {
      walk(root, path, notes, attachments);
      continue;
    }
    if (!entry.isFile() && !entry.isSymbolicLink()) continue;
    let size = 0;
    try {
      const stats = statSync(`${root}/${path}`);
      if (!stats.isFile()) continue;
      size = stats.size;
    } catch {
      continue;
    }
    if (extname(path) === "md") {
      notes.push({ path, size });
    } else {
      attachments.push({ path, size });
    }
  }
}

/** Non-markdown extensions that are rendered inline as images. */
export const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "avif",
  "bmp",
  "ico",
]);

export function isImage(path: string): boolean {
  return IMAGE_EXTENSIONS.has(extname(path));
}
