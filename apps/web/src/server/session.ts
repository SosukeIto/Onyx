import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getAuth } from "./auth";

/**
 * 現在のリクエストのセッションを返す server function。
 * 未ログインなら null。SSR / クライアント遷移のどちらからでも呼べる。
 */
export const fetchSession = createServerFn().handler(async () => {
  const session = await getAuth().api.getSession({
    headers: getRequest().headers,
  });

  if (!session) return null;

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
  };
});

export type SessionResult = Awaited<ReturnType<typeof fetchSession>>;
