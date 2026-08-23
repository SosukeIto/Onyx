import { SEARCH_PATH } from "@Onyx/vault/static/types";
import { createFileRoute } from "@tanstack/react-router";

import { fetchAsset } from "@/server/assets";
import { hasSession } from "@/server/guard";

/**
 * 全文検索のコーパス(`/vault/search.json`)。
 *
 * 検索そのものはクライアントで走る(src/lib/search.ts)ので、サーバーは
 * 「セッションを確認して 1 ファイル渡す」だけ。`/vault/*` を直接読ませない
 * ためにこの入口を通す。
 */
export const Route = createFileRoute("/api/vault/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await hasSession(request))) {
          return new Response(null, { status: 401 });
        }

        const upstream = await fetchAsset(SEARCH_PATH);
        if (!upstream.ok) {
          return new Response(null, { status: upstream.status });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "private, no-store",
            Vary: "Cookie",
          },
        });
      },
    },
  },
});
