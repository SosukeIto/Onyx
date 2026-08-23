# server

Hono + oRPC API. It mirrors the Obsidian vault with `git`, rebuilds the
in-memory index on every sync (no database) and serves attachments.

## ローカル開発

```bash
bun install
bun run dev:server   # http://localhost:3000
```

`apps/server/.env`(`.env.example` をコピー):

| 変数 | 既定値 | 説明 |
| --- | --- | --- |
| `CORS_ORIGIN` | `http://localhost:3001` | web の origin |
| `VAULT_REPO_URL` | `https://github.com/SosukeIto/my-vault.git` | 同期元リポジトリ |
| `VAULT_BRANCH` | `main` | 同期するブランチ |
| `VAULT_DIR` | `data/vault` | clone 先。**相対パスはリポジトリルート基準**で解決する(`process.cwd()` ではなく `apps/server/src/paths.ts` の `import.meta.dir` から辿る)。絶対パスも可 |
| `SYNC_INTERVAL_SEC` | `300` | `git fetch` の間隔。`0` で自動同期オフ |
| `SYNC_TOKEN` | (未設定) | `vault.sync` の共有シークレット。未設定だと `vault.sync` は `FORBIDDEN` |

`data/vault` は起動時に自動で `git clone --depth 1` される作業用ディレクトリで、
`.gitignore` 済み・いつ消しても再取得される(ローカル変更は `git reset --hard`
で破棄されるため、ここで編集しないこと)。同期に失敗しても HTTP サーバーは起動し、
理由は `vault.status` の `lastError` に入る。

## エンドポイント

- `GET /` — `OK`
- `GET /files/*` — vault の添付ファイル(拡張子ホワイトリスト + パストラバーサル検証)
- `POST /rpc/*` — oRPC(`packages/api` の `appRouter`)
- `/api-reference` — OpenAPI リファレンス
