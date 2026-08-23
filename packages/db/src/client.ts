import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema/index";

/**
 * Cloudflare D1 バインディング(`env.DB`)から drizzle クライアントを作る。
 *
 * Workers は 1 リクエスト = 1 バインディングなので、インスタンスは呼び出し側で
 * リクエストごとに(または module scope で env を掴んで一度だけ)生成する。
 *
 * @example
 * ```ts
 * import { env } from "cloudflare:workers";
 * const db = createDb(env.DB);
 * ```
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

/** `createDb()` が返す drizzle クライアントの型 */
export type Database = ReturnType<typeof createDb>;
