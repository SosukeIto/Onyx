# @Onyx/web

TanStack Start(SSR + server functions)を Cloudflare Workers にデプロイする、Onyx の唯一のアプリ。

- **vault の中身は DB に入らない**。GitHub Actions が `bun run build:vault` で焼いた静的バンドル
  (`public/vault/**` と `public/files/**`)を Workers の静的アセットとして配り、
  server function が `env.ASSETS` 経由で読む。Workers は git を実行しない。
- **D1 は better-auth のユーザー / セッションだけ**に使う。
- vault の JSON と添付は `wrangler.jsonc` の `assets.run_worker_first` で必ず Worker を先に通し、
  `src/routes/vault/$.ts` と `src/routes/files/$.ts` がセッションを確認してから返す。
  この設定を外すと未ログインでも vault が丸ごと読めてしまう。

## ローカル開発

```bash
bun install
cp apps/web/.dev.vars.example apps/web/.dev.vars   # BETTER_AUTH_SECRET を埋める
openssl rand -base64 32                            # シークレットの生成

bun run build:vault                                # public/vault/** と public/files/** を作る
bunx wrangler d1 migrations apply onyx-db --local  # ローカル D1(miniflare)にスキーマを流す

bun run --cwd apps/web dev                         # http://localhost:3000
```

初回は `/login` にしか入れない。ユーザーは下の「初期ユーザーの作成」で作る。

本番と同じ workerd で動かすなら:

```bash
bun run --cwd apps/web build
bun run --cwd apps/web preview     # ビルド時に dist/server/.dev.vars が焼かれる
```

`preview` は `.dev.vars` を**ビルド時**に取り込むので、シークレットを変えたら build からやり直すこと。

## 初期ユーザーの作成

Onyx は単一ユーザーなので `/api/auth/sign-up/email` は閉じている(`@Onyx/auth` の `SIGN_UP_ENABLED = false`)。
`BETTER_AUTH_SECRET` と同じ値を Bearer トークンにして `/api/admin/create-user` を一度だけ叩く。冪等。

```bash
curl -X POST http://localhost:3000/api/admin/create-user \
  -H "Authorization: Bearer $BETTER_AUTH_SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"8文字以上のパスワード","name":"you"}'
# => {"created":true,"userId":"...","email":"you@example.com"}
```

本番も同じ(URL を `https://<worker>.workers.dev` に変える)。

## Cloudflare へのデプロイ

```bash
bunx wrangler login

# 1. D1 を作り、出力された database_id を wrangler.jsonc の
#    d1_databases[0].database_id(いまはプレースホルダ)に貼る
bunx wrangler d1 create onyx-db

# 2. スキーマを本番 D1 に流す
bunx wrangler d1 migrations apply onyx-db --remote

# 3. シークレット(wrangler.jsonc には書かない)
bunx wrangler secret put BETTER_AUTH_SECRET

# 4. wrangler.jsonc の vars.BETTER_AUTH_URL を実際の Workers URL に直す

# 5. vault バンドルを焼いてからデプロイ
bun run build:vault
bun run deploy          # = vite build && wrangler deploy
```

デプロイ後、上の curl で初期ユーザーを 1 件作れば運用開始。

## 中身

```
src/routes/__root.tsx        html シェルだけ(<head> / テーマ / SW 登録 / devtools)
src/routes/login.tsx         ログイン画面(文字は入力値とサーバーのエラーだけ)
src/routes/_app/             ログイン必須のレイアウト。読書シェルと全画面がこの下
src/routes/api/auth/$.ts     better-auth のハンドラ
src/routes/api/vault/search  全文検索のコーパス(セッション確認つき)
src/routes/api/admin/…       初期ユーザー作成
src/routes/vault/$.ts        /vault/** の直リクエストをセッションで守る
src/routes/files/$.ts        /files/** の添付を配る
src/server/                  server function とサーバー専用モジュール(クライアントから import しない)
src/lib/queries.ts           画面ごとの queryOptions(すべて 1 本の manifest の切り出し)
src/lib/search.ts            クライアント側の全文検索
src/components/, src/styles/ 見た目(designer の担当領域)
```

### 画面

| パス                                  | 内容                                                |
| ------------------------------------- | --------------------------------------------------- |
| `/`                                   | 最近更新されたノートと今日の Daily Note             |
| `/note/<vault path>`                  | ノート本文・frontmatter・アウトライン・バックリンク |
| `/daily`, `/daily/<YYYY-MM-DD>`       | Daily Note とカレンダー                             |
| `/logs`                               | Claude ログ一覧(プロジェクトで絞り込み)             |
| `/search?q=`                          | 全文検索(フォルダ / タグのファセット)               |
| `/graph`                              | リンクグラフ(`?center=` でローカルグラフ)           |
| `/tags`, `/tags/<tag>`, `/unresolved` | タグ一覧・タグ別・未作成リンク                      |
| `/settings`                           | テーマ・パネル既定・バンドルの素性・サインアウト    |

## 検証

```bash
cd apps/web && bunx tsc --noEmit
bun run --cwd apps/web build      # dist/client + dist/client/sw.js が出る
```
