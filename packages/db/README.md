# @Onyx/db

Cloudflare D1(SQLite)を Drizzle ORM で扱うパッケージ。D1 に置くのは **better-auth のユーザー / セッションだけ**で、vault の内容(ノート・索引・添付)は入らない(`packages/vault` が JSON に焼いて静的アセットとして配る)。

- `createDb(d1)` → drizzle クライアント / `Database` 型 / `schema`(全テーブル)
- スキーマ: `src/schema/auth.ts`(**better-auth CLI の生成物。手で編集しない**)、`src/schema/index.ts` がエントリ

## マイグレーション

```sh
bun run --cwd packages/auth auth:generate   # スキーマを better-auth から再生成
bun run --cwd packages/db   db:generate     # migrations/*.sql を生成(drizzle-kit)
bun run --cwd packages/db   db:check        # 生成済みマイグレーションの整合性チェック

bunx wrangler d1 migrations apply onyx-db --local    # ローカル(.wrangler の SQLite)
bunx wrangler d1 migrations apply onyx-db --remote   # 本番の D1
```

`wrangler d1 migrations apply` は `apps/web/wrangler.jsonc` の `d1_databases[].migrations_dir` を見るので、そこに `../../packages/db/migrations` を指定する。
