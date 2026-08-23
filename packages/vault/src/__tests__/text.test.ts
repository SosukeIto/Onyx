import { describe, expect, test } from "vitest";
import { plainText, plainTextBody } from "../text";

describe("plainTextBody", () => {
  test("drops heading markers but keeps the heading text", () => {
    expect(plainTextBody("# 見出し\n\n### 🧑 自分\n\n## 閉じ ##")).toBe("見出し 🧑 自分 閉じ");
  });

  test("resolves wiki links, embeds and markdown links to their text", () => {
    expect(plainTextBody("[[Claude Log]]")).toBe("Claude Log");
    expect(plainTextBody("[[Note A|別名]]")).toBe("別名");
    expect(plainTextBody("[[Note A#見出し]]")).toBe("Note A 見出し");
    expect(plainTextBody("![[shot.png|300]]")).toBe("shot.png");
    expect(plainTextBody("[公式](https://example.com)")).toBe("公式");
    expect(plainTextBody("![代替テキスト](a/b.png)")).toBe("代替テキスト");
  });

  test("removes emphasis, strikethrough, highlight and code markers", () => {
    expect(plainTextBody("**太字** *斜体* ~~取消~~ ==強調== `code`")).toBe(
      "太字 斜体 取消 強調 code",
    );
    expect(plainTextBody("```bash\ncurl https://a.example\n```")).toBe("curl https://a.example");
  });

  test("removes quote, list, task and table markers", () => {
    expect(plainTextBody("> 引用文")).toBe("引用文");
    expect(plainTextBody("> [!note] メモ\n> 本文")).toBe("メモ 本文");
    expect(plainTextBody("- [ ] やる\n- [x] やった\n- 素\n1. 一番")).toBe("やる やった 素 一番");
    expect(plainTextBody("| A | B |\n| --- | --- |\n| 1 | 2 |")).toBe("A B 1 2");
  });

  test("removes comments, HTML tags, Templater and thematic breaks", () => {
    expect(plainTextBody("%%秘密%% 本文")).toBe("本文");
    expect(plainTextBody("%%\n秘密\n%%\n本文")).toBe("本文");
    expect(plainTextBody('<div class="x">中身</div>')).toBe("中身");
    expect(plainTextBody("<% tp.date.now() %>本文")).toBe("本文");
    expect(plainTextBody("上\n\n---\n\n下")).toBe("上 下");
  });

  test("collapses every run of whitespace into one space", () => {
    expect(plainTextBody("a\n\n\nb\t\tc   d")).toBe("a b c d");
  });
});

describe("plainText", () => {
  test("keeps working on inline fragments used for heading slugs", () => {
    expect(plainText("**強調**した見出し")).toBe("強調した見出し");
    expect(plainText("[[Note A|別名]] と `code`")).toBe("別名 と code");
  });
});
