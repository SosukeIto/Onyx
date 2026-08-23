import { buildIndex } from "../build";
import { fileURLToPath } from "node:url";
import type { VaultIndex } from "../types";

const root = fileURLToPath(new URL(".", import.meta.url));

/** Small hand-written vault covering the link-resolution edge cases. */
export function syntheticVault(): Promise<VaultIndex> {
  return buildIndex({ root: `${root}/fixtures/synthetic`, commit: "test" });
}

/**
 * A vault that mirrors the shape of the real Obsidian vault — the same folder
 * layout, Japanese names, Daily Note outline and Claude log frontmatter — with
 * entirely fictional notes.
 */
export function sampleVault(): Promise<VaultIndex> {
  return buildIndex({ root: `${root}/fixtures/vault`, commit: "test" });
}

/** One (fictional) Claude log packed with every markdown construct we strip. */
export function markupVault(): Promise<VaultIndex> {
  return buildIndex({ root: `${root}/fixtures/markup`, commit: "test" });
}

export const CLAUDE_LOG = "02_ClaudeLogs/Claude Log.md";
export const CLAUDE_LOG_ENTRY = "02_ClaudeLogs/2026-07-28_ノート間リンクの使いどころ_3c9f21ab.md";
export const DAILY = "00_Daily/2026/08/20.md";
export const PARAGRAPH = "01_Note/03_考え方/文章構成の型.md";
export const MARKUP_LOG = "02_ClaudeLogs/2026-06-24_Orbitのページに項目を追加_9d2e77c1.md";
