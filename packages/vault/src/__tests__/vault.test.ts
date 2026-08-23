import { beforeAll, describe, expect, test } from "vitest";
import { renderNote } from "../markdown/render";
import type { TreeFolder, VaultIndex } from "../types";
import { CLAUDE_LOG, CLAUDE_LOG_ENTRY, DAILY, PARAGRAPH, sampleVault } from "./helpers";

let index: VaultIndex;

beforeAll(async () => {
  index = await sampleVault();
});

describe("buildIndex on vault-shaped notes", () => {
  test("indexes every markdown file with its folder and size", () => {
    expect([...index.notes.keys()].sort()).toEqual(
      [DAILY, PARAGRAPH, CLAUDE_LOG_ENTRY, CLAUDE_LOG].sort(),
    );
    const note = index.notes.get(PARAGRAPH);
    expect(note?.folder).toBe("01_Note/03_考え方");
    expect(note?.basename).toBe("文章構成の型");
    expect(note?.size).toBeGreaterThan(0);
  });

  test("uses the frontmatter title and tags", () => {
    const note = index.notes.get(CLAUDE_LOG_ENTRY);
    expect(note?.title).toBe("ノート間リンクの使いどころ");
    expect(note?.tags).toEqual(["claude-log"]);
    expect(note?.frontmatter.session_id).toBe("3c9f21ab-5d84-4e17-9b02-71c4a6d8e530");
  });

  test("Claude Log collects the log notes as backlinks", () => {
    const backlinks = index.backlinks.get(CLAUDE_LOG) ?? [];
    expect(backlinks.map((link) => link.from)).toContain(CLAUDE_LOG_ENTRY);
    expect(index.tags.get("claude-log")).toContain(CLAUDE_LOG_ENTRY);
  });

  test("records unresolved wikilinks", () => {
    expect(index.unresolved.get("Daily Note")?.map((link) => link.from)).toEqual([DAILY]);
  });

  test("headings keep file-absolute line numbers", () => {
    const note = index.notes.get(CLAUDE_LOG_ENTRY);
    expect(note?.bodyLine).toBe(8);
    expect(note?.headings[0]).toEqual({
      depth: 1,
      text: "ノート間リンクの使いどころ",
      slug: "ノート間リンクの使いどころ",
      line: 9,
    });
  });

  test("builds a sorted folder tree with note counts", () => {
    expect(index.tree.noteCount).toBe(4);
    expect(index.tree.children.map((child) => child.name)).toEqual([
      "00_Daily",
      "01_Note",
      "02_ClaudeLogs",
    ]);
    const daily = index.tree.children[0] as TreeFolder;
    expect(daily.noteCount).toBe(1);
    expect(daily.children[0]).toMatchObject({ kind: "folder", name: "2026" });
  });
});

describe("rendering the vault-shaped notes", () => {
  test("the tab-indented Daily note is a list, not a code block", async () => {
    const rendered = await renderNote(index, DAILY);
    expect(rendered.html).not.toContain("<pre>");
    expect(rendered.html).not.toContain("<code>");
    expect(rendered.html).toContain("<ul>");
    expect(rendered.html).toContain("<li>やったこと");
    expect(rendered.html).toContain('<a class="wikilink unresolved" data-target="Daily Note">');
  });

  test("the log note links back to Claude Log", async () => {
    const rendered = await renderNote(index, CLAUDE_LOG_ENTRY);
    expect(rendered.html).toContain(`data-path="${CLAUDE_LOG}"`);
    expect(rendered.html).toContain('<h1 id="ノート間リンクの使いどころ">');
    expect(rendered.headings.map((heading) => heading.slug)).toContain("効いてくる場面");
    // The renderer and the index agree on slugs and line numbers.
    expect(rendered.headings[0]).toEqual(index.notes.get(CLAUDE_LOG_ENTRY)?.headings[0] as never);
  });

  test("external markdown links are left untouched", async () => {
    const rendered = await renderNote(index, PARAGRAPH);
    expect(rendered.html).toContain(
      'href="https://example.com/docs/LS_20260101_note_structure.pdf"',
    );
    expect(rendered.links).toEqual([]);
  });
});
