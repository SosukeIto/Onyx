import { beforeAll, describe, expect, test } from "vitest";
import { renderBody, renderNote } from "../markdown/render";
import type { VaultIndex } from "../types";
import { syntheticVault } from "./helpers";

let index: VaultIndex;
const from = "Home.md";
const render = (markdown: string): string => renderBody(index, from, markdown).html.trim();

beforeAll(async () => {
  index = await syntheticVault();
});

describe("wikilinks", () => {
  test("an existing note becomes an anchor with its vault path", () => {
    expect(render("[[Note A]]")).toBe(
      '<p><a href="/note/Note%20A" class="wikilink" data-path="Note A.md">Note A</a></p>',
    );
  });

  test("an alias replaces the displayed text", () => {
    expect(render("[[Note A|別名]]")).toContain(">別名</a>");
  });

  test("a heading fragment is appended as a slug", () => {
    expect(render("[[Note A#見出し ひとつ]]")).toBe(
      '<p><a href="/note/Note%20A#%E8%A6%8B%E5%87%BA%E3%81%97-%E3%81%B2%E3%81%A8%E3%81%A4" class="wikilink" data-path="Note A.md">Note A</a></p>',
    );
  });

  test("a missing note keeps the raw target and gets no href", () => {
    expect(render("[[存在しないノート]]")).toBe(
      '<p><a class="wikilink unresolved" data-target="存在しないノート">存在しないノート</a></p>',
    );
  });

  test("custom href builders are honoured", () => {
    const html = renderBody(index, from, "[[Note A]]", {
      noteHref: (path) => `#/n/${path}`,
    }).html;
    expect(html).toContain('href="#/n/Note%20A.md"');
  });
});

describe("embeds", () => {
  test("an image embed becomes a lazy img", () => {
    expect(render("![[pic.png]]")).toBe(
      '<p><img src="/files/attachments/pic.png" alt="pic.png" loading="lazy" data-path="attachments/pic.png"></p>',
    );
  });

  test("a pdf embed becomes an attachment link", () => {
    expect(render("![[handout.pdf]]")).toBe(
      '<p><a href="/files/attachments/handout.pdf" class="attachment" data-path="attachments/handout.pdf">handout.pdf</a></p>',
    );
  });

  test("a note embed is inlined exactly one level deep", () => {
    const html = render("![[a/Duplicate]]");
    expect(html.startsWith('<div class="embed" data-path="a/Duplicate.md">')).toBe(true);
    // `a/Duplicate.md` links to `Note A`, and that link is rendered…
    expect(html).toContain('data-path="Note A.md"');
    // …but `Note A`'s own body is not pulled in a second time.
    expect(html.match(/class="embed"/g)).toHaveLength(1);
  });
});

describe("obsidian inline syntax", () => {
  test("== highlights become <mark>", () => {
    expect(render("==強調==")).toBe("<p><mark>強調</mark></p>");
  });

  test("emphasis works next to CJK punctuation (Obsidian-compatible)", () => {
    expect(render("直後に**強調（ここ）**が続く")).toBe(
      "<p>直後に<strong>強調（ここ）</strong>が続く</p>",
    );
  });

  test("#tags become anchors carrying data-tag", () => {
    expect(render("本文の #inline-tag です")).toBe(
      '<p>本文の <a class="tag" data-tag="inline-tag">#inline-tag</a> です</p>',
    );
  });

  test("tags inside code are left alone", () => {
    expect(render("`#notatag`")).toBe("<p><code>#notatag</code></p>");
  });

  test("%%comments%% are dropped", () => {
    expect(render("前 %%消える%% 後")).toBe("<p>前  後</p>");
  });

  test("callouts keep their type and title", () => {
    expect(render("> [!note] メモのタイトル\n> 本文だよ")).toBe(
      [
        '<blockquote class="callout" data-callout="note">',
        '<p class="callout-title">メモのタイトル</p>',
        "<p>本文だよ</p>",
        "</blockquote>",
      ].join("\n"),
    );
  });

  test("a callout without a title falls back to its type", () => {
    expect(render("> [!warning]\n> 本文")).toContain('<p class="callout-title">warning</p>');
  });
});

describe("safety", () => {
  test("raw html and scripts are sanitized away", () => {
    expect(render('<script>alert(1)</script>\n\n<img src=x onerror="hack()">')).not.toContain(
      "onerror",
    );
    expect(render("<script>alert(1)</script>")).not.toContain("script");
  });

  test("javascript: urls are stripped", () => {
    expect(render("[x](javascript:alert(1))")).not.toContain("javascript:");
  });

  test("heading ids are not prefixed with user-content-", () => {
    expect(render("## 見出し")).toBe('<h2 id="見出し">見出し</h2>');
  });
});

describe("renderNote", () => {
  test("returns html, headings, links and tags of an indexed note", async () => {
    const rendered = await renderNote(index, "Note A.md");
    expect(rendered.headings).toEqual([
      { depth: 1, text: "Note A", slug: "note-a", line: 5 },
      { depth: 2, text: "見出し ひとつ", slug: "見出し-ひとつ", line: 9 },
    ]);
    expect(rendered.tags).toEqual(["alpha", "gamma"]);
    expect(rendered.html).toContain('<h2 id="見出し-ひとつ">');
  });

  test("throws for an unknown path", () => {
    expect(renderNote(index, "nope.md")).rejects.toThrow("note not found");
  });
});
