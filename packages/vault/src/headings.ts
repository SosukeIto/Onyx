import { createSlugger } from "./slug";
import { fencedCodeLines, plainText, splitLines } from "./text";
import type { Heading } from "./types";

const ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;

/**
 * Collect ATX headings from a note body.
 *
 * `lineOffset` is the 0-based line where the body starts inside the source
 * file (i.e. the number of frontmatter lines), so the returned `line` is
 * always file-absolute.
 */
export function extractHeadings(body: string, lineOffset = 0): Heading[] {
  const lines = splitLines(body);
  const fenced = fencedCodeLines(lines);
  const slugger = createSlugger();
  const headings: Heading[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (fenced[i]) continue;
    const line = lines[i] ?? "";
    const match = ATX.exec(line);
    if (!match?.[1]) continue;
    const depth = match[1].length as Heading["depth"];
    const raw = (match[2] ?? "").replace(/[ \t]+#+[ \t]*$/, "");
    const text = plainText(raw);
    headings.push({
      depth,
      text,
      slug: slugger.slug(text),
      line: i + lineOffset,
    });
  }
  return headings;
}
