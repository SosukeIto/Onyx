/**
 * @Onyx/db — Drizzle ORM + Cloudflare D1。
 *
 * - `schema` / 個別テーブル: Drizzle スキーマ(src/schema)
 * - `createDb(env.DB)`: D1 バインディングから drizzle クライアントを作るファクトリ
 * - マイグレーション SQL: packages/db/migrations(wrangler の D1 migrations 形式)
 *
 * D1 に置くのは better-auth のユーザー / セッションだけで、vault の内容は入らない。
 */

import * as schema from "./schema/index";

export { createDb, type Database } from "./client";
export * from "./schema/index";

/** drizzle / better-auth のアダプタに渡すスキーマ一式 */
export { schema };

export const DB_PACKAGE_NAME = "@Onyx/db";
