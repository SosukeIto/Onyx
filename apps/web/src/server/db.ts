import { createDb, type Database } from "@Onyx/db";
import { env } from "cloudflare:workers";

/**
 * サーバー側の drizzle クライアント。
 *
 * D1 に入るのは better-auth のユーザー / セッションだけで、vault の内容は入らない
 * (vault は静的アセットとして配信する。src/server/vault.ts を参照)。
 * D1 バインディングはリクエストコンテキスト外でも参照できるので、isolate ごとに
 * 1 度だけ作って使い回す。このモジュールはサーバー専用。
 */
let instance: Database | undefined;

export function getDb(): Database {
  instance ??= createDb(env.DB);
  return instance;
}
