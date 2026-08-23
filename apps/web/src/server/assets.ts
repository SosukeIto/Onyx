import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

/**
 * Workers の静的アセットを Worker 側から読む。
 *
 * vault バンドル(`/vault/**`)と添付(`/files/**`)は `wrangler.jsonc` の
 * `assets.run_worker_first` で「Worker が先」に設定してあるので、ブラウザからの
 * 直リクエストは必ず server route(src/routes/vault/$.ts, src/routes/files/$.ts)を
 * 通る。ここで使う `env.ASSETS` はその手前にある実体で、認証を通したあとに
 * だけ叩かれる。開発サーバー(@cloudflare/vite-plugin)では `public/` を、
 * 本番では `dist/client` を読む — どちらも同じ経路で動く。
 */
function assetUrl(path: string): string {
  return new URL(path, getRequest().url).toString();
}

/** 静的アセットを Response のまま返す(添付ファイルの中継用)。 */
export async function fetchAsset(path: string): Promise<Response> {
  return (await env.ASSETS.fetch(assetUrl(path))) as unknown as Response;
}

/**
 * 静的アセットの JSON を読む。存在しなければ `null`。
 * 404 とパースエラーを区別しないのは、どちらも「バンドルにその名前が無い」だから。
 */
export async function readJsonAsset<T>(path: string): Promise<T | null> {
  const response = await fetchAsset(path);
  if (!response.ok) return null;
  return (await response.json()) as T;
}
