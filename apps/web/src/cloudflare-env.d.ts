/**
 * `cloudflare:workers` の env(= Workers のバインディングとシークレット)の型。
 *
 * `wrangler types`(= `bun run cf-typegen`)の生成物 worker-configuration.d.ts は
 * .gitignore 対象なので、クリーンチェックアウトでの型チェックがそれに依存しないよう、
 * このアプリで実際に使う値だけをここで手書き宣言している。
 * `wrangler secret put` で入れるシークレットは wrangler.jsonc に現れないため、
 * どのみち手で書く必要がある。
 *
 * wrangler.jsonc のバインディング / vars や .dev.vars を増やしたら、ここも更新すること。
 */
declare module "cloudflare:workers" {
  export const env: CloudflareEnv;
}

interface CloudflareEnv {
  /** D1 データベース(wrangler.jsonc の d1_databases: binding = "DB")。better-auth 専用。 */
  DB: import("@cloudflare/workers-types").D1Database;

  /**
   * 静的アセット(dist/client)へのバインディング。
   * vault バンドル(/vault/**)と添付(/files/**)はここから読む。
   * wrangler.jsonc の assets.binding = "ASSETS"。
   */
  ASSETS: import("@cloudflare/workers-types").Fetcher;

  /**
   * better-auth の署名・暗号化キー。
   * ローカル: apps/web/.dev.vars / 本番: `wrangler secret put BETTER_AUTH_SECRET`
   */
  BETTER_AUTH_SECRET: string;

  /**
   * アプリのベース URL。
   * 本番: wrangler.jsonc の vars / ローカル: .dev.vars(vars を上書きする)
   */
  BETTER_AUTH_URL: string;
}
