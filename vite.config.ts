import { defineConfig } from "vite-plus";

/**
 * モノレポルートの Vite+ 設定。
 * lint (oxlint) / fmt (oxfmt) / test (vitest) の設定をここに集約する。
 * アプリ本体の Vite 設定は apps/web/vite.config.ts。
 */
export default defineConfig({
  lint: {
    ignorePatterns: [
      "**/dist/**",
      "**/.output/**",
      "**/.wrangler/**",
      "**/node_modules/**",
      "**/routeTree.gen.ts",
    ],
    options: {
      // 型情報を使ったルール + 型チェック本体(tsgolint / TypeScript 7 Go toolchain)
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: [
      "**/dist/**",
      "**/.output/**",
      "**/.wrangler/**",
      "**/node_modules/**",
      "**/routeTree.gen.ts",
      // 手書きの設計ドキュメント(HTML)は整形対象外
      "docs/**",
      "bun.lock",
      // drizzle-kit / better-auth CLI の生成物(再生成のたびに差分が出るため除外)
      "packages/db/migrations/**",
      "packages/db/src/schema/auth.ts",
      // vault ビルド成果物(静的アセット)
      "apps/web/public/vault/**",
      // テスト用フィクスチャ(整形すると期待値が変わるため除外)
      "packages/vault/src/__tests__/fixtures/**",
      // ローカルの vault クローン
      "data/**",
    ],
  },
});
