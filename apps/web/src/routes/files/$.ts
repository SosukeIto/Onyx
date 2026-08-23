import { createFileRoute } from "@tanstack/react-router";

import { serveAsset } from "@/server/serve-asset";

/**
 * 添付ファイル(`/files/<id>.<ext>`)。
 *
 * レンダラーが本文中に `<img src="/files/…">` を書き出すので、この URL は
 * Web オリジン上で解決できる必要がある。中身は vault の一部なので、
 * ノート本文と同じくログイン必須。ブラウザにだけキャッシュを許す
 * (デプロイごとに id が振り直されるので短めに)。
 */
export const Route = createFileRoute("/files/$")({
  server: {
    handlers: {
      GET: ({ request }) => serveAsset(request, { cacheControl: "private, max-age=3600" }),
    },
  },
});
