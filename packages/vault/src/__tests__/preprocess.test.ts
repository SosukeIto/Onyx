import { describe, expect, test } from "vitest";
import { preprocess } from "../markdown/preprocess";

describe("preprocess", () => {
  test("turns tab-hung lines into a nested bullet list", () => {
    const input = ["やること", "\t調査", "\t\t文献を探す", "\t報告"].join("\n");
    expect(preprocess(input)).toBe(["やること", "- 調査", "  - 文献を探す", "- 報告"].join("\n"));
  });

  test("keeps existing list markers and nests them under their parent", () => {
    const input = ["- 親", "\t- 子", "\t\t1. 孫"].join("\n");
    expect(preprocess(input)).toBe(["- 親", "  - 子", "    1. 孫"].join("\n"));
  });

  test("leaves lines without a leading tab untouched", () => {
    const input = ["- 既存のリスト", "1. 番号付き", "    4 スペースはコード"].join("\n");
    expect(preprocess(input)).toBe(input);
  });

  test("never touches fenced code blocks", () => {
    const input = ["```js", "\tconst a = 1;", "\t\treturn a;", "```"].join("\n");
    expect(preprocess(input)).toBe(input);
  });

  test("leaves dataview and Templater blocks alone", () => {
    const input = ["```dataview", "\tLIST FROM #claude-log", "```"].join("\n");
    expect(preprocess(input)).toBe(input);
  });

  test("is line preserving", () => {
    const input = ["a", "\tb", "\t\t", "", "\tc"].join("\n");
    const output = preprocess(input);
    expect(output.split("\n")).toHaveLength(input.split("\n").length);
    expect(output.split("\n")[2]).toBe("");
  });
});
