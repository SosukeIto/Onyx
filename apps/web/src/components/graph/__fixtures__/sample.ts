/**
 * Sample props for the graph screen of docs/demo.html — 20 nodes (5 of them
 * unresolved) and the links between them. Pass these into `GraphView` /
 * `GraphControls` to see the finished layout without a running server.
 */
import type { GraphFilters, GraphParams } from "../GraphControls";
import type { GraphEdge, GraphNode } from "../GraphView";

const CLAUDE_LOG = "02_ClaudeLogs/Claude Log.md";
const DAILY_NOTE = "00_Daily/Daily Note.md";
const LINKS_NOTE = "02_ClaudeLogs/2026-07-28_週次レビューの手順を決める_a3c81b52.md";
const DB_NOTE = "02_ClaudeLogs/2026-07-26_Obsidian のテーブル表示機能を検討_9c1f7a04.md";
const WIKI_NOTE = "02_ClaudeLogs/2026-07-10_Obsidianと静的Wikiの機能比較_1d76c4be.md";
const ORBIT_NOTE =
  "02_ClaudeLogs/2026-06-26_Orbitの資料一覧から特定のページが表示されない原因を調査_4e28d9f1.md";
const D0820 = "00_Daily/2026/08/20.md";
const D0819 = "00_Daily/2026/08/19.md";
const D0726 = "00_Daily/2026/07/26.md";
const ROADMAP = "01_Note/04_English/英文法メモ/00_学習計画.md";
const WORDS_USE = "01_Note/04_English/英文法メモ/単語帳/20_語彙ノートの使い方.md";
const WORDS_CORE = "01_Note/04_English/英文法メモ/単語帳/16_単語_基本コア.md";
const CONJUNCTION = "01_Note/04_English/英文法メモ/06_つなぎ言葉の使い分け.md";
const SHEET = "01_Note/04_English/英文法メモ/18_進捗メモ.md";
const SITE_NOTE = "01_Note/02_Projects/個人サイトの構成メモ.md";

export const sampleGraphNodes: GraphNode[] = [
  { id: CLAUDE_LOG, title: "Claude Log", kind: "note", inDegree: 139 },
  {
    id: LINKS_NOTE,
    title: "2026-07-28_週次レビューの手順を決める_a3c81b52",
    kind: "note",
    inDegree: 6,
  },
  {
    id: DB_NOTE,
    title: "2026-07-26_Obsidian のテーブル表示機能を検討_9c1f7a04",
    kind: "note",
    inDegree: 1,
  },
  {
    id: WIKI_NOTE,
    title: "2026-07-10_Obsidianと静的Wikiの機能比較_1d76c4be",
    kind: "note",
    inDegree: 1,
  },
  {
    id: ORBIT_NOTE,
    title: "2026-06-26_Orbitの資料一覧から特定のページが表示されない原因を調査_4e28d9f1",
    kind: "note",
    inDegree: 2,
  },
  { id: DAILY_NOTE, title: "Daily Note", kind: "note", inDegree: 20 },
  { id: D0820, title: "2026-08-20", kind: "note", inDegree: 1 },
  { id: D0819, title: "2026-08-19", kind: "note", inDegree: 1 },
  { id: D0726, title: "2026-07-26", kind: "note", inDegree: 1 },
  { id: "unresolved:MOC", title: "MOC", kind: "unresolved", inDegree: 9 },
  {
    id: "unresolved:タスク管理",
    title: "タスク管理",
    kind: "unresolved",
    inDegree: 3,
  },
  { id: "unresolved:命名規則", title: "命名規則", kind: "unresolved", inDegree: 3 },
  {
    id: "unresolved:ハブノートの作り方",
    title: "ハブノートの作り方",
    kind: "unresolved",
    inDegree: 3,
  },
  { id: ROADMAP, title: "00_学習計画", kind: "note", inDegree: 24 },
  { id: WORDS_USE, title: "20_語彙ノートの使い方", kind: "note", inDegree: 27 },
  { id: WORDS_CORE, title: "16_単語_基本コア", kind: "note", inDegree: 9 },
  {
    id: CONJUNCTION,
    title: "06_つなぎ言葉の使い分け",
    kind: "note",
    inDegree: 10,
  },
  { id: SHEET, title: "18_進捗メモ", kind: "note", inDegree: 8 },
  { id: SITE_NOTE, title: "個人サイトの構成メモ", kind: "note", inDegree: 9 },
  {
    id: "unresolved:デプロイ",
    title: "デプロイ",
    kind: "unresolved",
    inDegree: 3,
  },
];

export const sampleGraphEdges: GraphEdge[] = [
  { source: LINKS_NOTE, target: CLAUDE_LOG },
  { source: DB_NOTE, target: CLAUDE_LOG },
  { source: WIKI_NOTE, target: CLAUDE_LOG },
  { source: ORBIT_NOTE, target: CLAUDE_LOG },
  { source: D0820, target: DAILY_NOTE },
  { source: D0819, target: DAILY_NOTE },
  { source: D0726, target: DAILY_NOTE },
  { source: D0820, target: LINKS_NOTE },
  { source: LINKS_NOTE, target: "unresolved:MOC" },
  { source: LINKS_NOTE, target: "unresolved:タスク管理" },
  { source: LINKS_NOTE, target: "unresolved:ハブノートの作り方" },
  { source: DB_NOTE, target: "unresolved:命名規則" },
  { source: DB_NOTE, target: "unresolved:MOC" },
  { source: ORBIT_NOTE, target: "unresolved:タスク管理" },
  { source: ROADMAP, target: WORDS_USE },
  { source: ROADMAP, target: WORDS_CORE },
  { source: ROADMAP, target: CONJUNCTION },
  { source: ROADMAP, target: SHEET },
  { source: WORDS_USE, target: WORDS_CORE },
  { source: WORDS_CORE, target: SHEET },
  { source: SITE_NOTE, target: "unresolved:デプロイ" },
  { source: ORBIT_NOTE, target: SITE_NOTE },
  { source: D0819, target: SITE_NOTE },
];

export const sampleSelectedNodeId = CLAUDE_LOG;

export const sampleGraphParams: GraphParams = {
  nodeSize: 1,
  linkDistance: 180,
  repulse: 0.8,
};

export const sampleGraphFilters: GraphFilters = {
  tags: true,
  attachments: false,
  unresolved: true,
  orphans: false,
};
