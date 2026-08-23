import { describe, expect, test } from "vitest";
import { parseFrontmatter, resolveTitle } from "../frontmatter";
import { collectTags, normalizeFrontmatterTags } from "../tags";
import { syntheticVault } from "./helpers";

describe("parseFrontmatter", () => {
  test("splits the YAML block from the body", () => {
    const { frontmatter, body, bodyLine } = parseFrontmatter(
      '---\ntitle: "タイトル"\ndate: 2026-07-28\n---\n\n本文\n',
    );
    expect(frontmatter.title).toBe("タイトル");
    // YAML 1.2 core schema: dates stay strings, which keeps the index JSON-safe.
    expect(frontmatter.date).toBe("2026-07-28");
    expect(body).toBe("\n本文\n");
    expect(bodyLine).toBe(4);
  });

  test("keeps the whole file when there is no frontmatter", () => {
    const content = "# 見出し\n\n本文\n";
    const parsed = parseFrontmatter(content);
    expect(parsed.frontmatter).toEqual({});
    expect(parsed.body).toBe(content);
    expect(parsed.bodyLine).toBe(0);
  });

  test("keeps the whole file when the block is never closed", () => {
    const content = "---\ntitle: x\n\n本文\n";
    const parsed = parseFrontmatter(content);
    expect(parsed.frontmatter).toEqual({});
    expect(parsed.body).toBe(content);
  });

  test("broken YAML becomes an empty frontmatter, body untouched", () => {
    const parsed = parseFrontmatter(
      '---\ntitle: "壊れた\ntags: [a, b\n---\n\n本文はそのまま残る。\n',
    );
    expect(parsed.frontmatter).toEqual({});
    expect(parsed.body).toBe("\n本文はそのまま残る。\n");
  });

  test("resolveTitle falls back to the basename", () => {
    expect(resolveTitle({ title: "  タイトル " }, "basename")).toBe("タイトル");
    expect(resolveTitle({ title: "" }, "basename")).toBe("basename");
    expect(resolveTitle({}, "basename")).toBe("basename");
  });
});

describe("tags", () => {
  test("accepts an array", () => {
    expect(normalizeFrontmatterTags(["alpha", "beta"])).toEqual(["alpha", "beta"]);
  });

  test("accepts a plain string", () => {
    expect(normalizeFrontmatterTags("alpha beta")).toEqual(["alpha", "beta"]);
  });

  test("accepts a comma separated string", () => {
    expect(normalizeFrontmatterTags("alpha, delta")).toEqual(["alpha", "delta"]);
  });

  test("strips a leading hash and ignores empties", () => {
    expect(normalizeFrontmatterTags(["#alpha", "", null, 12])).toEqual(["alpha", "12"]);
  });

  test("collects inline tags but skips code, urls and headings", () => {
    const body = [
      "# 見出しは タグではない",
      "本文の #下書き と #0/INFO",
      "`#notatag` は無視",
      "https://example.com/#anchor も無視",
      "```",
      "#codetag",
      "```",
      "数字だけの #12 は無視",
    ].join("\n");
    expect(collectTags({ tags: ["frontmatter-tag"] }, body)).toEqual([
      "frontmatter-tag",
      "下書き",
      "0/INFO",
    ]);
  });
});

describe("frontmatter through buildIndex", () => {
  test("all three tag notations end up in Note.tags", async () => {
    const index = await syntheticVault();
    expect(index.notes.get("Home.md")?.tags).toEqual(["alpha", "beta", "inline-tag"]);
    expect(index.notes.get("tags-string.md")?.tags).toEqual(["alpha", "beta"]);
    expect(index.notes.get("tags-csv.md")?.tags).toEqual(["alpha", "delta"]);
    expect(index.tags.get("alpha")?.sort()).toEqual([
      "Home.md",
      "Note A.md",
      "tags-csv.md",
      "tags-string.md",
    ]);
  });

  test("a broken YAML block still yields a usable note", async () => {
    const index = await syntheticVault();
    const note = index.notes.get("broken.md");
    expect(note?.frontmatter).toEqual({});
    expect(note?.title).toBe("broken");
    expect(note?.body.trim()).toBe("本文はそのまま残る。");
  });
});
