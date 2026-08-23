# Onyx

[SosukeIto/my-vault](https://github.com/SosukeIto/my-vault) の Obsidian vault をブラウザで読むための Web アプリ。
データベースを持たず、サーバーが vault を `git clone` してメモリ上に索引を組み立てる。UI の文字は最小限で、読む文字はノート本文だけ。

- 設計プラン: [docs/plan.html](docs/plan.html)
- デザイン基準(デモ): [docs/demo.html](docs/demo.html)
- 運用ルール: [CLAUDE.md](CLAUDE.md)

## 起動

```bash
bun install
bun run dev          # web http://localhost:3001 / server http://localhost:3000
```

初回起動時に `data/vault` へ vault が clone され(約 4 秒)、以降は `SYNC_INTERVAL_SEC`(既定 300 秒)ごとに `git fetch` して変更があれば索引を作り直す。設定は `apps/server/.env`(詳細は [apps/server/README.md](apps/server/README.md))。

## 画面

| パス | 内容 |
| --- | --- |
| `/` | 最近更新されたノートと今日の Daily Note |
| `/note/<vault path>` | ノート本文・frontmatter・アウトライン・バックリンク |
| `/daily/<YYYY-MM-DD>` | Daily Note とカレンダー |
| `/logs` | Claude ログ一覧(プロジェクトで絞り込み) |
| `/search?q=` | 全文検索(フォルダ / タグのファセット) |
| `/graph` | リンクグラフ(`?center=` でローカルグラフ) |
| `/tags`, `/tags/<tag>`, `/unresolved` | タグ一覧・タグ別・未作成リンク |
| `/settings` | テーマ・パネル既定・同期状態 |

## 構成

```
apps/web        TanStack Router + Vite + Tailwind v4(見た目は components/、配線は routes/ と lib/)
apps/server     Hono + Bun。git 同期、/files/* 配信、oRPC ハンドラ
packages/api    oRPC ルーターと zod スキーマ
packages/vault  インデクサ・Obsidian Markdown パイプライン・検索(純粋ロジック、bun test)
packages/env    環境変数スキーマ
packages/ui     shadcn/ui プリミティブ
```

## 検証

```bash
bun run check         # biome
bun run check-types   # tsc / vite build
cd packages/vault && bun test
```
