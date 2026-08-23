/**
 * @Onyx/auth — better-auth の設定。
 *
 * Cloudflare Workers では D1 バインディングがリクエスト時にしか手に入らないため、
 * auth インスタンスはモジュールトップレベルでは作らず {@link createAuth} で組み立てる。
 * 呼び出し側(apps/web/src/server/auth.ts)が `cloudflare:workers` の env から
 * `DB` と `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` を渡す。
 */

import type { D1Database } from "@cloudflare/workers-types";
import { createDb, schema } from "@Onyx/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import {
	APP_NAME,
	EMAIL_AND_PASSWORD_ENABLED,
	MAX_PASSWORD_LENGTH,
	MIN_PASSWORD_LENGTH,
	REQUIRE_EMAIL_VERIFICATION,
	SESSION_EXPIRES_IN_SECONDS,
	SESSION_UPDATE_AGE_SECONDS,
	SIGN_UP_ENABLED,
} from "./config";

export * from "./config";
export { createUser, type CreateUserInput, type CreateUserResult } from "./create-user";

export interface CreateAuthOptions {
	/** wrangler.jsonc の d1_databases バインディング(env.DB) */
	d1: D1Database;
	/** 署名・暗号化に使う秘密鍵。ローカルは .dev.vars、本番は wrangler secret put */
	secret: string;
	/**
	 * アプリのベース URL。省略するとリクエストの Origin から推測される。
	 * 本番でリダイレクト先を固定したい場合に指定する。
	 */
	baseURL?: string;
	/** CSRF 判定で許可するオリジン(baseURL 以外からアクセスする場合) */
	trustedOrigins?: Array<string>;
}

/**
 * D1 バインディングを受け取って better-auth インスタンスを返すファクトリ。
 *
 * @example
 * ```ts
 * import { env } from "cloudflare:workers";
 * const auth = createAuth({ d1: env.DB, secret: env.BETTER_AUTH_SECRET });
 * return auth.handler(request);
 * ```
 */
export function createAuth({
	d1,
	secret,
	baseURL,
	trustedOrigins,
}: CreateAuthOptions) {
	return betterAuth({
		appName: APP_NAME,
		secret,
		baseURL,
		trustedOrigins,
		database: drizzleAdapter(createDb(d1), {
			provider: "sqlite",
			schema,
		}),
		emailAndPassword: {
			enabled: EMAIL_AND_PASSWORD_ENABLED,
			// Onyx は単一ユーザーの招待制。初期ユーザーは createUser() で作る
			disableSignUp: !SIGN_UP_ENABLED,
			requireEmailVerification: REQUIRE_EMAIL_VERIFICATION,
			minPasswordLength: MIN_PASSWORD_LENGTH,
			maxPasswordLength: MAX_PASSWORD_LENGTH,
		},
		session: {
			expiresIn: SESSION_EXPIRES_IN_SECONDS,
			updateAge: SESSION_UPDATE_AGE_SECONDS,
		},
		advanced: {
			// D1 は SQLite なので JOIN を使った読み出し最適化を有効にできる
			database: { joins: true },
		},
		// TanStack Start の Cookie 機構に Set-Cookie を橋渡しする(server functions 用)
		plugins: [tanstackStartCookies()],
	});
}

/** {@link createAuth} が返す better-auth インスタンスの型 */
export type Auth = ReturnType<typeof createAuth>;

/** better-auth が返すセッション + ユーザー */
export type AuthSession = Auth["$Infer"]["Session"];

export const AUTH_PACKAGE_NAME = "@Onyx/auth";
