import { createAuthClient } from "better-auth/react";

/**
 * ブラウザ側の better-auth クライアント。
 *
 * baseURL は指定しない = 同一オリジンの /api/auth を叩く。
 * SSR 中でもこのモジュール自体は安全(fetch はイベントハンドラからしか呼ばない)。
 * Onyx は単一ユーザーなので sign-up は無効。初期ユーザーは
 * /api/admin/create-user(README.md 参照)で作る。
 */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
