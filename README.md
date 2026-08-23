# Onyx

[SosukeIto/my-vault](https://github.com/SosukeIto/my-vault) の Obsidian vault をブラウザで読むための Web アプリ。
構成は muscle-memo と同じ: **TanStack Start(SSR)+ Cloudflare Workers + D1/Drizzle + better-auth + PWA、Vite+(vp)**。
vault の内容は DB に置かず、GitHub Actions がビルド時に索引・HTML を JSON 化して Workers の静的アセットとして配る。UI の文字は最小限で、読む文字はノート本文だけ。

- 設計プラン: [docs/plan.html](docs/plan.html) / デザイン基準: [docs/demo.html](docs/demo.html) / 運用ルール: [CLAUDE.md](CLAUDE.md)
- アプリの詳細(ローカル手順・D1・シークレット・デプロイ): [apps/web/README.md](apps/web/README.md)

## ローカルで動かす

```bash
bun install
bun run build:vault                      # data/vault に my-vault を clone → apps/web/public/vault/* と public/files/* を生成
cp apps/web/.dev.vars.example apps/web/.dev.vars   # BETTER_AUTH_SECRET を適当な長い文字列に
bunx wrangler d1 migrations apply onyx-db --local  # apps/web で実行(ローカル D1)
bun run dev                              # http://localhost:3000
```

初回ユーザーはサインアップ無効のため API で作る(`Bearer` は `.dev.vars` の `BETTER_AUTH_SECRET`):

```bash
curl -X POST http://localhost:3000/api/admin/create-user \
  -H "Authorization: Bearer <BETTER_AUTH_SECRET>" -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"********","name":"you"}'
```

`bun run build && bun run preview` で本番と同じ workerd 上で確認できる(http://localhost:4173)。

## デプロイ(Cloudflare、無料枠)

1. `bunx wrangler login` → `bunx wrangler d1 create onyx-db` の `database_id` を `apps/web/wrangler.jsonc` に設定、`vars.BETTER_AUTH_URL` を実際の Workers URL に
2. `cd apps/web && bunx wrangler secret put BETTER_AUTH_SECRET`
3. `bun run deploy`(= build + `wrangler deploy`)。初回は `bunx wrangler d1 migrations apply onyx-db --remote`
4. 自動デプロイ: Onyx の Secrets に `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`。vault の更新に追随させるには `docs/my-vault-onyx.yml` を my-vault の `.github/workflows/onyx.yml` に置く(push 時 + 15 分ごと。public リポジトリ側で動くので Actions の分数を消費しない)

## 画面

| パス                                  | 内容                                                  |
| ------------------------------------- | ----------------------------------------------------- |
| `/login`                              | better-auth(メール + パスワード、サインアップ無効)    |
| `/`                                   | 最近更新されたノートと今日の Daily Note               |
| `/note/<vault path>`                  | ノート本文・frontmatter・アウトライン・バックリンク   |
| `/daily/<YYYY-MM-DD>`                 | Daily Note とカレンダー                               |
| `/logs`                               | Claude ログ一覧(プロジェクトで絞り込み)               |
| `/search?q=`                          | 全文検索(クライアント側、フォルダ / タグのファセット) |
| `/graph`                              | リンクグラフ(`?center=` でローカルグラフ)             |
| `/tags`, `/tags/<tag>`, `/unresolved` | タグ一覧・タグ別・未作成リンク                        |
| `/settings`                           | テーマ・パネル既定・ビルド情報・サインアウト          |

## 構成

```
apps/web        TanStack Start + Cloudflare Workers(routes/ _app/ 配下は要ログイン、server/ に server functions)
packages/vault  インデクサ・Obsidian Markdown・検索・静的バンドル生成(純粋ロジック、vitest)
packages/db     Drizzle + D1(better-auth のテーブルのみ)
packages/auth   better-auth 設定と createUser
packages/ui     shadcn/ui プリミティブ
scripts/        build-vault.ts(静的バンドル生成)
.github/        deploy.yml(ビルド + wrangler deploy。my-vault から workflow_call される)
```

## 検証

```bash
bun run check       # vp: fmt + lint(型チェック込み)
bun run typecheck   # tsc(ルート / apps/web / packages/vault)
bun run test        # vitest
```
