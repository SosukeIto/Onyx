import { createUser } from "@Onyx/auth";
import { env } from "cloudflare:workers";

import { getAuth } from "./auth";

/**
 * 初期ユーザーを 1 件作るブートストラップ処理(server route の中身)。
 *
 * Onyx は単一ユーザーなので公開の sign-up は閉じてある。デプロイ直後に
 * `BETTER_AUTH_SECRET` と同じ値を Bearer トークンとして送り、
 * `/api/admin/create-user` を一度だけ叩く(curl の例は apps/web/README.md)。
 * シークレットを知っているのは `wrangler secret put` をした本人だけなので、
 * これが唯一の入口になる。
 *
 * 冪等: 同じメールのユーザーが既に居れば `created: false` を返して何も書かない。
 */
export async function handleCreateUser(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return new Response(null, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const email = stringField(body, "email");
  const password = stringField(body, "password");
  const name = stringField(body, "name") ?? email;
  if (!email || !password || !name) {
    return json({ error: "email and password are required" }, 400);
  }

  try {
    const result = await createUser(getAuth(), { email, password, name });
    return json(result, result.created ? 201 : 200);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Length-independent comparison so the token is not leaked by timing. */
function secretEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function isAuthorized(request: Request): boolean {
  const header = request.headers.get("Authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  const secret = env.BETTER_AUTH_SECRET;
  if (!secret) return false;

  return secretEquals(header.slice(prefix.length), secret);
}

function stringField(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}
