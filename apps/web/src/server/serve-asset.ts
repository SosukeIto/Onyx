import { fetchAsset } from "./assets";
import { hasSession } from "./guard";

/**
 * ログインしている閲覧者にだけ静的アセットを中継する。
 *
 * `/vault/**`(バンドルの JSON)と `/files/**`(添付)は Workers Assets が
 * Worker より先に返してしまうと未ログインでも読めてしまうので、
 * `wrangler.jsonc` の `assets.run_worker_first` でこの経路を必ず通るようにしてある。
 * ここを外すと vault が丸ごと公開される。
 *
 * `Vary: Cookie` と `private` は、CDN や共有プロキシがログイン後のレスポンスを
 * 別の人へ配ってしまわないための最低条件。
 */
export async function serveAsset(
  request: Request,
  options: { cacheControl: string },
): Promise<Response> {
  if (!(await hasSession(request))) {
    return new Response(null, { status: 401 });
  }

  const { pathname } = new URL(request.url);
  const upstream = await fetchAsset(pathname);
  if (!upstream.ok) {
    return new Response(null, { status: upstream.status });
  }

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", options.cacheControl);
  headers.append("Vary", "Cookie");

  return new Response(upstream.body, { status: 200, headers });
}
