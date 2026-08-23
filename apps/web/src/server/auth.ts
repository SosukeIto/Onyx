import { type Auth, createAuth } from "@Onyx/auth";
import { env } from "cloudflare:workers";

/**
 * サーバー側の better-auth インスタンス。
 *
 * Workers ではシークレットとバインディングは `cloudflare:workers` の `env` から取る。
 * 環境変数・シークレットとバインディングの参照はリクエストコンテキスト外でも可能なので、
 * インスタンスは isolate ごとに 1 度だけ作って使い回す。
 *
 * このモジュールはサーバー専用。クライアントからは src/lib/auth-client.ts を使うこと。
 */
let instance: Auth | undefined;

export function getAuth(): Auth {
  instance ??= createAuth({
    d1: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
  });
  return instance;
}
