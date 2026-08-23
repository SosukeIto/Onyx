import { createFileRoute } from "@tanstack/react-router";

import { serveAsset } from "@/server/serve-asset";

/**
 * 静的 vault バンドル(`/vault/manifest.json`, `/vault/notes/<id>.json`,
 * `/vault/search.json`)を、セッションを確認したうえで配信する。
 *
 * 通常の読み出しは server function(src/server/vault.ts)が Worker 内部から
 * 直接 `env.ASSETS` を叩くのでここは通らない。この route が存在する理由は
 * 「ブラウザが URL を直打ちしても未ログインなら 401 になる」ことの保証。
 */
export const Route = createFileRoute("/vault/$")({
  server: {
    handlers: {
      GET: ({ request }) => serveAsset(request, { cacheControl: "private, no-store" }),
    },
  },
});
