import { splitLines } from "../text";

const LIST_MARKER = /^(\s*)([-*+]|\d+[.)])([ \t]+)/;
const FENCE = /^(\s*)(`{3,}|~{3,})/;

/**
 * Obsidian (and the Daily Notes in this vault) uses a leading tab purely as
 * an outline indent, even when the line is not a list item. CommonMark turns
 * those lines into indented code blocks, which destroys the note.
 *
 * This pass rewrites tab-indented lines into nested bullet items:
 *
 * ```text
 * やること            →  やること
 * \t調査              →  - 調査
 * \t\t文献を探す      →    - 文献を探す
 * ```
 *
 * Lines that already start with `- ` / `1. ` keep their own marker, lines
 * without a leading tab are copied verbatim, and fenced code blocks
 * (including ```` ```dataview ```` and Templater `<% … %>` snippets) are left
 * untouched. The transform is line-preserving, so line numbers stay valid.
 */
export function preprocess(body: string): string {
  const lines = splitLines(body);
  const out: string[] = new Array(lines.length);
  let fence: string | null = null;
  let baseIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    if (fence !== null) {
      out[i] = line;
      const trimmed = line.trimStart();
      if (trimmed.startsWith(fence) && trimmed.slice(fence.length).trim() === "") {
        fence = null;
      }
      continue;
    }
    const openFence = FENCE.exec(line);
    if (openFence?.[2]) {
      fence = openFence[2];
      out[i] = line;
      continue;
    }

    let tabs = 0;
    while (line.charAt(tabs) === "\t") tabs++;

    if (tabs === 0) {
      out[i] = line;
      const marker = LIST_MARKER.exec(line);
      baseIndent =
        marker?.[1] !== undefined && marker[2] !== undefined
          ? marker[1].length + marker[2].length + 1
          : 0;
      continue;
    }

    const rest = line.slice(tabs);
    if (rest.trim() === "") {
      out[i] = "";
      continue;
    }
    const indent = " ".repeat(baseIndent + (tabs - 1) * 2);
    out[i] = LIST_MARKER.test(rest) ? indent + rest : `${indent}- ${rest}`;
  }

  return out.join("\n");
}
