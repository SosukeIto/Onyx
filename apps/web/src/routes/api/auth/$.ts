import { createFileRoute } from "@tanstack/react-router";

import { getAuth } from "@/server/auth";

/**
 * better-auth のハンドラを /api/auth/* にマウントする server route。
 * sign-in / get-session / sign-out などはすべてここが受ける
 * (sign-up は @Onyx/auth の SIGN_UP_ENABLED = false で閉じている)。
 */
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => getAuth().handler(request),
      POST: ({ request }) => getAuth().handler(request),
    },
  },
});
