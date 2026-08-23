/**
 * Sample props for the shared note list. `sampleRecentNotes` is the home /
 * "recently updated" shape (folder + date), `sampleDailyNotes` is the daily
 * screen's recent list, and `sampleTagNotes` is the tag page shape (count).
 */
import type { NoteListItem } from "../NoteList";

export const sampleRecentNotes: NoteListItem[] = [
  {
    path: "02_ClaudeLogs/2026-08-20_日報テンプレの整理_5d1c8e70.md",
    title: "2026-08-20_日報テンプレの整理_5d1c8e70",
    folder: "02_ClaudeLogs",
    modified: "2026-08-20 21:04",
    tags: ["claude-log"],
  },
  {
    path: "02_ClaudeLogs/2026-08-06_PDF から表データを抜き出す_2e90b4c1.md",
    title: "2026-08-06_PDF から表データを抜き出す_2e90b4c1",
    folder: "02_ClaudeLogs",
    modified: "2026-08-06 13:38",
    tags: ["claude-log"],
  },
  {
    path: "01_Note/03_考え方/長い文章を書くときは見出しから先に決めてしまう.md",
    title: "長い文章を書くときは見出しから先に決めてしまう",
    folder: "01_Note/03_考え方",
    modified: "2026-08-04 09:12",
  },
  {
    path: "02_ClaudeLogs/2026-07-30_長文ノートの分割方針を検討_6f42d3a9.md",
    title: "2026-07-30_長文ノートの分割方針を検討_6f42d3a9",
    folder: "02_ClaudeLogs",
    modified: "2026-07-30 22:47",
    tags: ["claude-log"],
  },
  {
    path: "01_Note/04_English/英文法メモ/00_学習計画.md",
    title: "00_学習計画",
    folder: "01_Note/04_English/英文法メモ",
    modified: "2026-07-29 18:20",
  },
];

export const sampleDailyNotes: NoteListItem[] = [
  {
    path: "00_Daily/2026/08/20.md",
    title: "2026-08-20",
    folder: "00_Daily/2026/08",
  },
  {
    path: "00_Daily/2026/08/19.md",
    title: "2026-08-19",
    folder: "00_Daily/2026/08",
  },
  {
    path: "00_Daily/2026/08/18.md",
    title: "2026-08-18",
    folder: "00_Daily/2026/08",
  },
  {
    path: "00_Daily/2026/08/12.md",
    title: "2026-08-12",
    folder: "00_Daily/2026/08",
  },
  {
    path: "00_Daily/2026/08/10.md",
    title: "2026-08-10",
    folder: "00_Daily/2026/08",
  },
];

export const sampleTagNotes: NoteListItem[] = [
  {
    path: "02_ClaudeLogs/2026-07-28_週次レビューの手順を決める_a3c81b52.md",
    title: "2026-07-28_週次レビューの手順を決める_a3c81b52",
    folder: "02_ClaudeLogs",
    count: 6,
  },
  {
    path: "02_ClaudeLogs/2026-07-26_Obsidian のテーブル表示機能を検討_9c1f7a04.md",
    title: "2026-07-26_Obsidian のテーブル表示機能を検討_9c1f7a04",
    folder: "02_ClaudeLogs",
    count: 1,
  },
];

export const sampleActiveListPath = "02_ClaudeLogs/2026-08-20_日報テンプレの整理_5d1c8e70.md";
