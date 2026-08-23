/**
 * Sample props that reproduce docs/demo.html. Used instead of a Storybook: pass
 * these into `AppShell` / `LeftPanel` / `RightPanel` / `NoteView` to see the
 * finished layout without a running server.
 *
 * The HTML below is written the way `@Onyx/vault`'s renderNote() must emit it —
 * it doubles as the fixture for the class-name contract in
 * `apps/web/src/styles/prose.css`.
 */
import type { Heading, TreeFile, TreeFolder, TreeNode } from "@Onyx/vault";

import type { BacklinkItem } from "../Backlinks";
import type { BreadcrumbSegment, SyncState } from "../Header";
import type { NoteInfoProps } from "../NoteInfo";

function file(folder: string, name: string): TreeFile {
  return {
    kind: "file",
    name,
    path: folder ? `${folder}/${name}.md` : `${name}.md`,
    title: name,
  };
}

function dir(path: string, children: TreeNode[], noteCount: number): TreeFolder {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return { kind: "folder", name, path, children, noteCount };
}

export const sampleActivePath = "02_ClaudeLogs/2026-07-28_週次レビューの手順を決める_a3c81b52.md";

export const sampleTree: TreeFolder = dir(
  "",
  [
    dir("00_Daily", [dir("00_Daily/2026", [], 18), file("00_Daily", "Daily Note")], 19),
    dir(
      "01_Note",
      [
        dir("01_Note/01_Research", [], 24),
        dir("01_Note/02_Projects", [], 31),
        dir(
          "01_Note/03_考え方",
          [
            file("01_Note/03_考え方", "2026-07-10_問題は分けて考える"),
            file("01_Note/03_考え方", "長い文章を書くときは見出しから先に決めてしまう"),
            file("01_Note/03_考え方", "アウトラインから書く"),
            file("01_Note/03_考え方", "図と表では伝わる情報が違う"),
            file("01_Note/03_考え方", "迷ったら小さく試してみる"),
            file("01_Note/03_考え方", "自分で決められないことは気にしない"),
          ],
          6,
        ),
        dir(
          "01_Note/04_English",
          [
            dir(
              "01_Note/04_English/英文法メモ",
              [
                dir("01_Note/04_English/英文法メモ/単語帳", [], 12),
                file("01_Note/04_English/英文法メモ", "00_学習計画"),
                file("01_Note/04_English/英文法メモ", "06_つなぎ言葉の使い分け"),
              ],
              14,
            ),
            file("01_Note/04_English", "動詞の形まとめ"),
          ],
          15,
        ),
      ],
      92,
    ),
    dir(
      "02_ClaudeLogs",
      [
        dir("02_ClaudeLogs/projects", [], 18),
        file("02_ClaudeLogs", "Claude Log"),
        file("02_ClaudeLogs", "2026-08-20_日報テンプレの整理_5d1c8e70"),
        file("02_ClaudeLogs", "2026-08-06_PDF から表データを抜き出す_2e90b4c1"),
        file("02_ClaudeLogs", "2026-07-30_長文ノートの分割方針を検討_6f42d3a9"),
        file("02_ClaudeLogs", "2026-07-28_タグ設計：階層タグと属性タグの使い分け_7b03e5c2"),
        file("02_ClaudeLogs", "2026-07-28_週次レビューの手順を決める_a3c81b52"),
        file("02_ClaudeLogs", "2026-07-26_Obsidian のテーブル表示機能を検討_9c1f7a04"),
        file("02_ClaudeLogs", "2026-07-17_ファイル命名規則の見直し_b8e5602d"),
        file("02_ClaudeLogs", "2026-07-10_Obsidianと静的Wikiの機能比較_1d76c4be"),
        file(
          "02_ClaudeLogs",
          "2026-06-26_Orbitの資料一覧から特定のページが表示されない原因を調査_4e28d9f1",
        ),
        file("02_ClaudeLogs", "2026-06-22_レビュー時間の見積もり_c50a8f36"),
      ],
      105,
    ),
    dir(
      "98_templates",
      [
        file("98_templates", "10_current_time"),
        file("98_templates", "created"),
        file("98_templates", "daily"),
      ],
      3,
    ),
    dir("99_scripts", [], 0),
  ],
  219,
);

export const sampleDefaultOpen = ["01_Note", "01_Note/03_考え方", "02_ClaudeLogs"];

export const sampleNoteCount = 148;

export const sampleBreadcrumb: BreadcrumbSegment[] = [
  { label: "02_ClaudeLogs", href: "/folder/02_ClaudeLogs" },
  { label: "2026-07-28_週次レビューの手順を決める_a3c81b52" },
];

export const sampleSync: SyncState = {
  syncedAt: "2026-08-22 08:35",
  commit: "65df74d",
};

export const sampleFrontmatter: Record<string, unknown> = {
  title: "週次レビューの手順を決める",
  date: "2026-07-28",
  created: "2026-07-28 19:46",
  tags: ["claude-log"],
  session_id: "a3c81b52-4e77-42d9-9c14-0b6ea3f81d55",
};

export const sampleHeadings: Heading[] = [
  {
    depth: 1,
    text: "週次レビューの手順を決める",
    slug: "weekly-review",
    line: 8,
  },
  { depth: 3, text: "自分", slug: "me-1", line: 12 },
  { depth: 3, text: "Claude", slug: "claude-1", line: 15 },
  { depth: 2, text: "三段の手順", slug: "three-steps", line: 19 },
  { depth: 2, text: "やらないこと", slug: "not-to-do", line: 41 },
  { depth: 3, text: "自分", slug: "me-2", line: 50 },
  { depth: 3, text: "Claude", slug: "claude-2", line: 53 },
  { depth: 2, text: "次にやること", slug: "todo", line: 58 },
];

export const sampleActiveSlug = "three-steps";

export const sampleBacklinks: BacklinkItem[] = [
  {
    from: "00_Daily/2026/07/28.md",
    fromTitle: "28",
    excerpt: "Obsidian のリンク運用を整理 → [[2026-07-28_週次レビューの手順を決める_a3c81b52]]",
  },
  {
    from: "01_Note/03_考え方/2026-07-10_問題は分けて考える.md",
    fromTitle: "2026-07-10_問題は分けて考える",
    excerpt: "リンクは後から張れる。参照: [[2026-07-28_週次レビューの手順を決める_a3c81b52]]",
  },
];

export const sampleUnresolved = [
  "MOC",
  "タスク管理",
  "命名規則",
  "ハブノートの作り方",
  "Map of Content",
];

export const sampleNoteInfo: NoteInfoProps = {
  path: "02_ClaudeLogs/2026-07-28_週次レビューの手順を決める_a3c81b52.md",
  modified: "2026-07-28 20:12",
  size: 11_526,
  linkCount: 6,
  unresolvedCount: 5,
  commit: "a41f9c2",
};

/**
 * Renderer output shape. Every construct that prose.css styles appears once:
 * wikilink (resolved / unresolved), tag, mark, callout, embed, task list,
 * table, code block, image and math.
 */
export const sampleNoteHtml = `
<h1 id="weekly-review">週次レビューの手順を決める</h1>
<p><a class="wikilink" data-path="02_ClaudeLogs/Claude Log.md" href="/note/02_ClaudeLogs/Claude%20Log.md">Claude Log</a></p>

<h3 id="me-1">自分</h3>
<p>毎週ノートを見返そうと思っているのに続かない。手順を決めて<code>[[]]</code>で関連ノートにつなぐところまで型にしたい</p>

<h3 id="claude-1">Claude</h3>
<p>続かない原因はたいてい <strong>「何を見るか」が毎回ぶれる</strong> ことです。見る対象と順番を固定して、<strong>終わりの合図</strong>を決めると習慣になります。手順は三段だけにしましょう。</p>

<h2 id="three-steps">三段の手順</h2>
<p>今週の Daily を上から流し読みし、気になった行の先頭に <code>!</code> を付ける。立ち止まらず、<a class="wikilink unresolved" data-target="気になった行の扱い" href="/note/気になった行の扱い">気になった行の扱い</a> は次の段に回します。</p>
<p>あとで書きたいテーマは <a class="wikilink unresolved" data-target="週次レビュー" href="/note/週次レビュー">週次レビュー</a> <a class="wikilink unresolved" data-target="見返しのコツ" href="/note/見返しのコツ">見返しのコツ</a> のように名前だけ置いておくと、次週の入口になります。</p>

<blockquote class="callout" data-callout="note">
<p class="callout-title">先に枠だけ作る</p>
<p>集約用のノートは毎週同じ名前規則にしておくと、<strong>週番号で並べて比較</strong>できます。テンプレートに見出しを 3 つ置き、<strong>空の見出しを埋めるだけ</strong>の作業にするのがコツです。</p>
</blockquote>

<p>テンプレートはこれで十分です。</p>
<pre><code class="language-markdown">---
week: 2026-W31
reviewed: false
---
</code></pre>

<div class="table-wrap"><table>
<thead><tr><th>段</th><th>やること</th><th>目安</th></tr></thead>
<tbody>
<tr><td>1</td><td>Daily を流し読みして <code>!</code> を付ける</td><td>10 分</td></tr>
<tr><td>2</td><td><code>!</code> の行を 1 枚に集めてリンクする</td><td>10 分</td></tr>
<tr><td>3</td><td>来週の最初の一手を 1 行書く</td><td>2 分</td></tr>
</tbody>
</table></div>

<h2 id="not-to-do">やらないこと</h2>
<p>全部のノートを整理し直そうとしないこと。レビューの目的は <mark>今週の考えを来週につなぐ</mark> ことで、倉庫の棚卸しではありません。</p>
<blockquote class="callout" data-callout="warning">
<p class="callout-title">手順を増やしすぎない</p>
<p>三段で収まらなくなったら、足すのではなく <strong>どれかを削る</strong>。手順が 5 つを超えた週は、ほぼ確実に翌週やらなくなります。</p>
</blockquote>
<blockquote class="callout" data-callout="tip">
<p class="callout-title">終わりの合図を決める</p>
<p>タイマーが鳴ったら途中でも閉じる。残りは来週の 1 段目に自然に回ってきます。</p>
</blockquote>

<h3 id="me-2">自分</h3>
<p>レビューした週としていない週を区別したい。チェックボックスを frontmatter に置ける？</p>

<h3 id="claude-2">Claude</h3>
<p>frontmatter に <code>reviewed: true</code> を置けば、プロパティ表示でチェックボックスになります。本文に <code>- [x]</code> を書く方式でも <del>集計はできません</del> 集計できますが、検索しやすさでは frontmatter が有利です。</p>

<hr>
<h2 id="todo">次にやること</h2>
<ul class="contains-task-list">
<li class="task-list-item"><input checked disabled type="checkbox"> レビュー用テンプレートに見出しを 3 つ置く</li>
<li class="task-list-item"><input disabled type="checkbox"> Daily の frontmatter に week を足す</li>
<li class="task-list-item"><input disabled type="checkbox"> <a class="wikilink unresolved" data-target="気になった行の扱い" href="/note/気になった行の扱い">気になった行の扱い</a> を書き起こす</li>
</ul>

<p>所要時間の見積もりはこの埋め込みで足りる。</p>
<div class="embed" data-path="02_ClaudeLogs/2026-06-22_レビュー時間の見積もり.md#1. 合計時間">
<p>見返す Daily の枚数 <em>n</em> に対して 1 枚あたりの時間 <em>t</em> を一定とみなす。合計は枚数に比例し、上限を 10 分に固定する。</p>
<p><a class="attachment" data-path="99_assets/review-time.pdf" href="/files/99_assets/review-time.pdf">review-time.pdf</a></p>
</div>

<p>
<a class="tag" data-tag="claude-log" href="/tag/claude-log">claude-log</a>
<a class="tag" data-tag="obsidian" href="/tag/obsidian">obsidian</a>
<a class="tag" data-tag="レビュー" href="/tag/%E3%83%AC%E3%83%93%E3%83%A5%E3%83%BC">レビュー</a>
</p>
`;
