import type { D1Database } from "@cloudflare/workers-types";

import { createAuth } from "./index";

/**
 * better-auth CLI(`bun run --cwd packages/auth auth:generate`)専用のエントリ。
 *
 * CLI は auth インスタンスから必要なテーブル定義を読み取って
 * packages/db/src/schema/auth.ts を再生成する。スキーマの読み取りしか行わないので
 * D1 バインディングもシークレットもダミーで構わない。
 *
 * **実行時にこのファイルを import してはいけない。** アプリからは `createAuth()` を使うこと。
 */
export const auth = createAuth({
  d1: undefined as unknown as D1Database,
  secret: "cli-only-placeholder-secret-not-used-at-runtime",
  baseURL: "http://localhost:3000",
});
