import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit の設定(Cloudflare D1 = SQLite)。
 *
 * `bun run --cwd packages/db db:generate` で ./migrations に SQL を生成する。
 * 生成物は wrangler の D1 migrations 形式(`0000_xxx.sql`)なので、
 * apps/web/wrangler.jsonc の `migrations_dir` から直接適用できる。
 *
 * ここでは D1 への接続情報(driver: "d1-http")はあえて設定しない。
 * マイグレーションの適用は wrangler(`wrangler d1 migrations apply`)に任せ、
 * drizzle-kit は SQL 生成専用として使う。
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  strict: true,
  verbose: true,
});
