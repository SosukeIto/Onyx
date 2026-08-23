import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getAuth } from "./auth";

/**
 * server function 用の認証ミドルウェア。
 *
 * server function は「ルートとは独立して直接叩ける API エンドポイント」なので、
 * ルートの `beforeLoad` は UX のためのガードにすぎない。データの境界はここ。
 * vault の内容に触れる server function には必ずこのミドルウェアを付ける。
 *
 * 未ログインなら /login へリダイレクトする(クライアントからの呼び出しでは
 * ルーターがそのリダイレクトを処理する)。
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const session = await getAuth().api.getSession({
    headers: getRequest().headers,
  });
  if (!session) throw redirect({ to: "/login" });

  return next({
    context: {
      userId: session.user.id,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    },
  });
});
