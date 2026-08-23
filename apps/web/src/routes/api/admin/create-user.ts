import { createFileRoute } from "@tanstack/react-router";

import { handleCreateUser } from "@/server/create-user";

/**
 * 初期ユーザー作成(単一ユーザーのブートストラップ)。
 * 実装は src/server/create-user.ts。`Authorization: Bearer <BETTER_AUTH_SECRET>` が要る。
 */
export const Route = createFileRoute("/api/admin/create-user")({
  server: {
    handlers: {
      POST: ({ request }) => handleCreateUser(request),
    },
  },
});
