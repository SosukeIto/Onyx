# @Onyx/auth

better-auth の設定。D1 バインディングはリクエスト時にしか取れないので、インスタンスは `createAuth({ d1, secret, baseURL })` で組み立てる(`Auth` 型 / `AuthSession` 型も export)。方針は `src/config.ts`: メール + パスワード、セッション 30 日、`tanstackStartCookies` プラグイン、**サインアップは無効(`SIGN_UP_ENABLED = false`)の単一ユーザー**。

呼び出し側(`apps/web`)は Workers の env から `DB` / `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` を渡す。

```sh
bun run --cwd packages/auth auth:generate            # ../db/src/schema/auth.ts を再生成
bun run --cwd packages/db   db:generate              # 続けて SQL を生成
bunx wrangler d1 migrations apply onyx-db --local    # ローカルに適用(本番は --remote)
```

## 初期ユーザーを作る

サインアップが閉じているので `/api/auth/sign-up/email` は 400 を返す(`auth.api.signUpEmail()` をサーバーから呼んでも同じ経路で弾かれる)。代わりに `createUser(auth, { email, password, name })` を使う。これは better-auth の内部アダプタで user 行と credential account 行を sign-up と同じ手順で作る冪等な関数で、`{ created, userId, email }` を返す。

```ts
// apps/web の管理用 server function など、Workers 上で 1 度だけ実行する
import { env } from "cloudflare:workers";
import { createAuth, createUser } from "@Onyx/auth";

const auth = createAuth({ d1: env.DB, secret: env.BETTER_AUTH_SECRET });
await createUser(auth, { email: "me@example.com", password: "...", name: "me" });
```

`wrangler d1 execute` で user / account を直接 INSERT するのは現実的でない。パスワードは better-auth のデフォルトの **scrypt** でハッシュ + ソルトされ、検証時もそのアルゴリズムに一致する必要があるため、SQL だけでは正しい `account.password` を作れない。必ず Workers 上(`wrangler dev` でも可)から上記の関数を通すこと。
