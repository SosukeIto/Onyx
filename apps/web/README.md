# web

Onyx の閲覧 UI(Vite + React + TanStack Router)。RPC は `VITE_SERVER_URL` の `/rpc` を叩く。

## 添付ファイル(`/files`)

- サーバーのレンダラは画像・添付を `<img src="/files/…">` というルート相対 URL で出力する(絶対 URL にはしない)。
- 開発時は Vite の `server.proxy` で `/files` → `http://127.0.0.1:3000` に転送している(`vite.config.ts`)。
- 本番でも **web と同じオリジンの `/files/*` を server(Hono の `serveVaultFile`)へ振り分ける**前提。別オリジンに置く場合はこのプロキシ設定に相当する経路が必要。
