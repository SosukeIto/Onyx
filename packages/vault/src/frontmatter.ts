import { parse as parseYaml } from "yaml";
import type { NoteFrontmatter } from "./types";

export interface ParsedDocument {
  frontmatter: NoteFrontmatter;
  /** Markdown body with the frontmatter block removed. */
  body: string;
  /** 0-based line in the source file where `body` starts. */
  bodyLine: number;
}

const OPEN = /^\uFEFF?---[ \t]*$/;
const CLOSE = /^(---|\.\.\.)[ \t]*$/;

/**
 * Split a note into its YAML frontmatter and its body.
 *
 * A malformed YAML block is treated as an empty frontmatter; the body is
 * still everything after the closing delimiter. When there is no complete
 * `---` block the whole file is the body.
 */
export function parseFrontmatter(content: string): ParsedDocument {
  const lines = content.split("\n");
  const first = lines[0];
  if (first === undefined || !OPEN.test(first.replace(/\r$/, ""))) {
    return { frontmatter: {}, body: content, bodyLine: 0 };
  }

  let close = -1;
  for (let i = 1; i < lines.length; i++) {
    if (CLOSE.test((lines[i] ?? "").replace(/\r$/, ""))) {
      close = i;
      break;
    }
  }
  if (close === -1) {
    return { frontmatter: {}, body: content, bodyLine: 0 };
  }

  const raw = lines.slice(1, close).join("\n");
  const body = lines.slice(close + 1).join("\n");
  let frontmatter: NoteFrontmatter = {};
  try {
    const parsed: unknown = parseYaml(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      frontmatter = parsed as NoteFrontmatter;
    }
  } catch {
    frontmatter = {};
  }
  return { frontmatter, body, bodyLine: close + 1 };
}

/** `frontmatter.title` when it is a non-empty string, otherwise `basename`. */
export function resolveTitle(frontmatter: NoteFrontmatter, basename: string): string {
  const title = frontmatter.title;
  if (typeof title === "string" && title.trim() !== "") return title.trim();
  if (typeof title === "number") return String(title);
  return basename;
}
