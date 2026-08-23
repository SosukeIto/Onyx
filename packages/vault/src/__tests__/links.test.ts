import { beforeAll, describe, expect, test } from "vitest";
import { extractLinks, resolveAttachment, resolveLink } from "../links";
import type { VaultIndex } from "../types";
import { syntheticVault } from "./helpers";

let index: VaultIndex;

beforeAll(async () => {
  index = await syntheticVault();
});

describe("extractLinks", () => {
  test("reads targets, aliases and headings", () => {
    const links = extractLinks(
      "Home.md",
      "[[Note A]] [[Note A|別名]] [[Note A#見出し]] ![[pic.png]]",
    );
    expect(links).toEqual([
      {
        from: "Home.md",
        to: null,
        target: "Note A",
        kind: "wiki",
        line: 0,
      },
      {
        from: "Home.md",
        to: null,
        target: "Note A",
        alias: "別名",
        kind: "wiki",
        line: 0,
      },
      {
        from: "Home.md",
        to: null,
        target: "Note A",
        heading: "見出し",
        kind: "wiki",
        line: 0,
      },
      {
        from: "Home.md",
        to: null,
        target: "pic.png",
        kind: "embed",
        line: 0,
      },
    ]);
  });

  test("ignores code blocks, inline code and absolute urls", () => {
    const body = [
      "`[[inline]]`",
      "```",
      "[[fenced]]",
      "```",
      "[外部](https://example.com/x.md)",
      "[相対](a/Duplicate.md)",
    ].join("\n");
    const links = extractLinks("Home.md", body);
    expect(links).toEqual([
      {
        from: "Home.md",
        to: null,
        target: "a/Duplicate.md",
        alias: "相対",
        kind: "markdown",
        line: 5,
      },
    ]);
  });

  test("reports file-absolute line numbers via the offset", () => {
    const links = extractLinks("Home.md", "\n[[Note A]]", 5);
    expect(links[0]?.line).toBe(6);
  });

  test("skips empty wikilinks", () => {
    expect(extractLinks("Home.md", "[[]] と [[ ]]")).toEqual([]);
  });
});

describe("resolveLink", () => {
  test("resolves a plain target to its vault path", () => {
    expect(resolveLink(index, "Home.md", "Note A")).toBe("Note A.md");
  });

  test("ignores the alias and the heading fragment", () => {
    expect(resolveLink(index, "Home.md", "Note A|別名")).toBe("Note A.md");
    expect(resolveLink(index, "Home.md", "Note A#見出し ひとつ")).toBe("Note A.md");
  });

  test("is case insensitive", () => {
    expect(resolveLink(index, "Home.md", "note a")).toBe("Note A.md");
    expect(resolveLink(index, "Home.md", "NOTE A.MD")).toBe("Note A.md");
  });

  test("resolves an explicit vault-relative path", () => {
    expect(resolveLink(index, "Home.md", "a/Duplicate")).toBe("a/Duplicate.md");
    expect(resolveLink(index, "b/Deep.md", "a/Duplicate.md")).toBe("a/Duplicate.md");
  });

  test("picks the closest candidate when the basename is ambiguous", () => {
    expect(resolveLink(index, "b/Deep.md", "Duplicate")).toBe("b/Duplicate.md");
    expect(resolveLink(index, "a/Duplicate.md", "Duplicate")).toBe("a/Duplicate.md");
  });

  test("returns null for a note that does not exist", () => {
    expect(resolveLink(index, "Home.md", "存在しないノート")).toBeNull();
  });

  test("a bare heading link points back at the note itself", () => {
    expect(resolveLink(index, "Home.md", "#見出し")).toBe("Home.md");
  });
});

describe("resolveAttachment", () => {
  test("falls back to the attachments folder", () => {
    expect(resolveAttachment(index, "Home.md", "pic.png")).toBe("attachments/pic.png");
    expect(resolveAttachment(index, "b/Deep.md", "handout.pdf")).toBe("attachments/handout.pdf");
  });

  test("ignores the Obsidian size suffix", () => {
    expect(resolveAttachment(index, "Home.md", "pic.png|300")).toBe("attachments/pic.png");
  });

  test("returns null for an unknown file", () => {
    expect(resolveAttachment(index, "Home.md", "missing.png")).toBeNull();
  });
});

describe("the link graph", () => {
  test("collects backlinks and unresolved targets", () => {
    expect(index.backlinks.get("Note A.md")?.map((l) => l.from)).toContain("Home.md");
    expect([...index.unresolved.keys()]).toContain("存在しないノート");
  });

  test("indexes basenames and attachment names", () => {
    expect(index.byBasename.get("Duplicate")).toEqual(["a/Duplicate.md", "b/Duplicate.md"]);
    expect(index.attachmentsByName.get("pic.png")).toEqual(["attachments/pic.png"]);
  });
});
