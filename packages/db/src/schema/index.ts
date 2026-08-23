/**
 * Drizzle スキーマのエントリポイント。
 * drizzle-kit(packages/db/drizzle.config.ts)はこのファイルを読んで
 * migrations/*.sql を生成する。
 *
 * - `./auth`: **自動生成**。better-auth CLI が作る標準テーブル
 *   (user / session / account / verification)。手で編集せず
 *   `bun run --cwd packages/auth auth:generate` で再生成する
 *
 * Onyx は vault の内容(ノート本文・索引・添付)を D1 に置かない
 * (CLAUDE.md の決定事項)。それらは packages/vault が JSON へ焼いて
 * Workers の静的アセットとして配る。したがってアプリ固有テーブルは無く、
 * このパッケージは better-auth のユーザー / セッションだけを持つ。
 */
export * from "./auth";
