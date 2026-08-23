/**
 * server function から「見つからなかった」を伝えるための約束事。
 *
 * server function の例外はネットワークを跨ぐ間に素の `Error` へ潰れるので、
 * `status` のような追加プロパティは残らない。そこでメッセージの先頭に印を付け、
 * クライアント側(src/router.tsx のエラートースト)がそれを見て黙るようにする。
 * 「今日の Daily Note がまだ無い」は読者に知らせるべきエラーではない。
 */
const NOT_FOUND_PREFIX = "onyx:not-found:";

export function notFoundError(what: string): Error {
  return new Error(`${NOT_FOUND_PREFIX}${what}`);
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith(NOT_FOUND_PREFIX);
}

/** 印を取り除いた本文(画面に出すのは常にこちら)。 */
export function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith(NOT_FOUND_PREFIX) ? message.slice(NOT_FOUND_PREFIX.length) : message;
}
