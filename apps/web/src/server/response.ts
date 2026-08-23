import { setResponseHeader } from "@tanstack/react-start/server";

/**
 * ログイン中ユーザー固有のレスポンスをキャッシュさせない。
 *
 * server function のレスポンスはセッションに依存するので、`public` キャッシュに
 * 載ると別の閲覧者へ配信されうる。CDN / ブラウザのどちらにも保存させない。
 */
export function noStore(): void {
  setResponseHeader("Cache-Control", "no-store");
  setResponseHeader("Vary", "Cookie");
}
