import { beforeAll, describe, expect, test } from "vitest";
import { search } from "../search";
import type { VaultIndex } from "../types";
import { CLAUDE_LOG_ENTRY, MARKUP_LOG, markupVault, sampleVault, syntheticVault } from "./helpers";

let real: VaultIndex;
let synthetic: VaultIndex;
let markup: VaultIndex;

beforeAll(async () => {
  [real, synthetic, markup] = await Promise.all([sampleVault(), syntheticVault(), markupVault()]);
});

describe("search", () => {
  test("an empty query returns nothing", () => {
    expect(search(real, "")).toEqual([]);
    expect(search(real, "   ")).toEqual([]);
  });

  test("matches Japanese substrings in the body", () => {
    const hits = search(real, "バックリンク");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.map((hit) => hit.path)).toContain(CLAUDE_LOG_ENTRY);
    const hit = hits.find((entry) => entry.path === CLAUDE_LOG_ENTRY);
    expect(hit?.count).toBeGreaterThan(1);
  });

  test("snippet ranges point at the match inside `text`", () => {
    const hits = search(synthetic, "パラグラフ");
    const snippet = hits[0]?.snippets[0];
    expect(snippet).toBeDefined();
    for (const [start, end] of snippet?.ranges ?? []) {
      expect(snippet?.text.slice(start, end)).toBe("パラグラフ");
    }
  });

  test("snippets carry roughly 40 characters of context", () => {
    const hits = search(real, "バックリンク");
    const snippet = hits[0]?.snippets[0];
    const [start] = snippet?.ranges[0] ?? [0, 0];
    expect(start).toBeLessThanOrEqual(40);
    expect(snippet?.text.length).toBeLessThanOrEqual(200);
  });

  test("title matches rank above body-only matches", () => {
    const hits = search(synthetic, "note a");
    expect(hits[0]?.path).toBe("Note A.md");
    expect(hits.length).toBeGreaterThan(1);
  });

  test("is case insensitive and NFKC folded", () => {
    expect(search(synthetic, "NOTE A")[0]?.path).toBe("Note A.md");
    expect(search(synthetic, "ＮＯＴＥ　Ａ")[0]?.path).toBe("Note A.md");
  });

  test("honours limit, folder and tag filters", () => {
    expect(search(synthetic, "の", { limit: 1 })).toHaveLength(1);
    expect(search(synthetic, "の", { limit: 0 })).toEqual([]);
    const inB = search(synthetic, "同名ノート", { folder: "b" });
    expect(inB.map((hit) => hit.path)).toEqual(["b/Duplicate.md"]);
    const tagged = search(synthetic, "の", { tag: "gamma" });
    expect(tagged.map((hit) => hit.path)).toEqual(["Note A.md"]);
  });

  test("snippets are plain text, never markdown source", () => {
    const hit = search(markup, "Orbit").find((entry) => entry.path === MARKUP_LOG);
    expect(hit).toBeDefined();
    expect(hit?.snippets.length).toBeGreaterThan(0);

    for (const snippet of hit?.snippets ?? []) {
      for (const markers of ["#", "[[", "]]", "**", "==", "~~", "`", "|", "%%"]) {
        expect(snippet.text).not.toContain(markers);
      }
      expect(snippet.text).not.toContain("<div");
      for (const [start, end] of snippet.ranges) {
        expect(snippet.text.slice(start, end).toLowerCase()).toBe("orbit");
      }
    }
  });

  test("ranges land on the match inside the plain snippet", () => {
    const hit = search(markup, "Orbit").find((entry) => entry.path === MARKUP_LOG);
    const first = hit?.snippets[0];
    expect(first?.text.startsWith("Orbitのページに項目を追加 Claude Log")).toBe(true);
    expect(first?.ranges[0]).toEqual([0, 5]);
    // Title (1) + body (8); markup-only text such as the link target of
    // `[[Orbit API|API メモ]]` is not counted.
    expect(hit?.count).toBe(9);
  });

  test("counts every occurrence and sorts by count", () => {
    const hits = search(real, "リンク");
    expect(hits[0]?.count).toBeGreaterThanOrEqual(hits[1]?.count ?? 0);
  });
});
