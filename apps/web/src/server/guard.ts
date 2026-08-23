import { getAuth } from "./auth";

/**
 * server route(`/vault/*`, `/files/*`, `/api/vault/search`)用のセッション確認。
 *
 * server function と違ってリダイレクトを投げても意味が無い(画像や JSON への
 * リクエストなので)ため、真偽値だけを返して呼び出し側に 401 を返させる。
 *
 * `authMiddleware`(./middleware.ts)と分けてあるのは、あちらが server function の
 * クライアント側スタブからも参照される — 参照は残るがサーバー実装は
 * バンドラが落とす — のに対し、こちらは素の関数で、辿られるとサーバー専用の
 * `cloudflare:workers` がクライアントバンドルに紛れ込むため。
 * このモジュールは server route からのみ import すること。
 */
export async function hasSession(request: Request): Promise<boolean> {
  const session = await getAuth().api.getSession({ headers: request.headers });
  return session !== null;
}
