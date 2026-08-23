/**
 * Sample props for the search screen of docs/demo.html (query: `Orbit`).
 * Pass these into `SearchInput` / `SearchResults` / `SearchFacets` to see the
 * finished layout without a running server.
 */
import type { FolderFacet, MonthFacet, TagFacet } from "../SearchFacets";
import type { SearchOptions } from "../SearchInput";
import type { SearchHit, SearchRange, SearchSnippet } from "../SearchResults";

export const sampleQuery = "Orbit";

export const sampleOptions: SearchOptions = {
  caseSensitive: false,
  regex: false,
  fulltext: true,
};

/**
 * Builds the `[start, end)` ranges the server would send, so the fixture can
 * never drift from the snippet text it is written against.
 */
function snippet(text: string, term = sampleQuery): SearchSnippet {
  const ranges: SearchRange[] = [];
  const haystack = text.toLowerCase();
  const needle = term.toLowerCase();
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) {
      break;
    }
    ranges.push([at, at + needle.length]);
    from = at + needle.length;
  }
  return { text, ranges };
}

export const sampleHits: SearchHit[] = [
  {
    path: "02_ClaudeLogs/2026-06-30_ワークスペース間のデータ移行を調査_3a7be812.md",
    title: "2026-06-30_ワークスペース間のデータ移行を調査_3a7be812",
    count: 29,
    snippets: [
      snippet("最初にOrbit接続ツールを読み込み、設定も確認します。"),
      snippet("Orbitに既に移行先のワークスペースがあります。中身を確認します。"),
    ],
  },
  {
    path: "02_ClaudeLogs/2026-07-17_ファイル命名規則の見直し_b8e5602d.md",
    title: "2026-07-17_ファイル命名規則の見直し_b8e5602d",
    count: 18,
    snippets: [
      snippet("Orbitの資料ページと文献管理DB（31件）を確認しました。その上で答えます。"),
      snippet("調べた結果はOrbitに1テーマ1ページでまとめる"),
    ],
  },
  {
    path: "00_Daily/2026/07/26.md",
    title: "26",
    count: 1,
    snippets: [snippet("orbitからobisidianへの移行作業")],
  },
];

export const sampleFolderFacets: FolderFacet[] = [
  { path: "02_ClaudeLogs", count: 34 },
  { path: "00_Daily", count: 1 },
  { path: "01_Note", count: 0 },
  { path: "98_templates", count: 0 },
];

export const sampleTagFacets: TagFacet[] = [{ tag: "claude-log", count: 34 }];

export const sampleMonthFacets: MonthFacet[] = [
  { ym: "2026-06", count: 14 },
  { ym: "2026-07", count: 18 },
  { ym: "2026-08", count: 3 },
];

export const sampleSelectedFolder = "02_ClaudeLogs";
