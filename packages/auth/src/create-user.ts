/**
 * 初期ユーザー(単一ユーザー)を作るためのブートストラップ関数。
 *
 * Onyx は招待制なので config.ts の {@link SIGN_UP_ENABLED} が false で、
 * better-auth の `/api/auth/sign-up/email` は 400 を返す。
 * `auth.api.signUpEmail()` をサーバーから呼んでも同じ経路を通るため使えない
 * (better-auth 1.7.1 の dist/api/routes/sign-up.mjs 冒頭で
 *  `emailAndPassword.disableSignUp` を見て弾いている)。
 * そこで {@link createUser} は better-auth の内部アダプタを直接使って
 * user 行 + credential account 行(scrypt ハッシュ済みパスワード)を作る。
 * 手順は sign-up エンドポイントの実装と同じで、公開エンドポイントは閉じたまま。
 *
 * この関数はサーバー(Workers / スクリプト)からのみ呼ぶこと。
 * 呼び出し方は packages/auth/README.md を参照。
 */

import { createLocalAccountIssuer } from "better-auth/db";

import type { Auth } from "./index";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface CreateUserResult {
  /** 既に同じメールのユーザーが居た場合は false(何も書き込まない) */
  created: boolean;
  userId: string;
  email: string;
}

/**
 * メール + パスワードのユーザーを 1 件作る。既に存在する場合は何もしない(冪等)。
 *
 * @example
 * ```ts
 * const auth = createAuth({ d1: env.DB, secret: env.BETTER_AUTH_SECRET });
 * await createUser(auth, { email: "me@example.com", password: "...", name: "me" });
 * ```
 */
export async function createUser(
  auth: Auth,
  { email, password, name }: CreateUserInput,
): Promise<CreateUserResult> {
  const ctx = await auth.$context;
  const normalizedEmail = email.trim().toLowerCase();

  const { minPasswordLength, maxPasswordLength } = ctx.password.config;
  if (password.length < minPasswordLength) {
    throw new Error(`password must be at least ${minPasswordLength} characters`);
  }
  if (password.length > maxPasswordLength) {
    throw new Error(`password must be at most ${maxPasswordLength} characters`);
  }

  const existing = await ctx.internalAdapter.findUserByEmail(normalizedEmail);
  if (existing?.user) {
    return {
      created: false,
      userId: existing.user.id,
      email: existing.user.email,
    };
  }

  // sign-up エンドポイントと同じ順序: 先にハッシュ、その後に user / account を作る
  const hash = await ctx.password.hash(password);
  const user = await ctx.internalAdapter.createUser(
    { email: normalizedEmail, name, emailVerified: false },
    { method: "email-password" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    issuer: createLocalAccountIssuer("credential"),
    accountId: user.id,
    password: hash,
  });

  return { created: true, userId: user.id, email: user.email };
}
