import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import {
  IconAlert,
  IconArrowRight,
  IconKey,
  IconLogo,
  IconSync,
  IconType,
} from "@/components/icons";
import { authClient } from "@/lib/auth-client";
import { fetchSession } from "@/server/session";

/**
 * The only screen outside the reading shell.
 *
 * There is no wording on it: the two fields are an `aria-label` plus a glyph
 * (identifier / key), and the submit button is an arrow. The only characters a
 * reader ever sees here are the ones they type, and — when it fails — whatever
 * better-auth said went wrong.
 */
export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    // ログイン済みならトップへ
    if (await fetchSession()) throw redirect({ to: "/" });
  },
  component: LoginRoute,
});

const FIELD =
  "h-12 w-full min-w-0 rounded-lg border border-line bg-elev pr-3 pl-10 text-ink text-ui outline-none transition-colors placeholder:text-transparent focus:border-brand";

function LoginRoute() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = await authClient.signIn.email({ email, password });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? String(result.error.status));
      return;
    }

    await router.invalidate();
    await router.navigate({ to: "/" });
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-app px-6 py-[12vh]">
      <IconLogo className="text-ink-faint" size={56} strokeWidth={1.1} />

      <form className="flex w-full max-w-[300px] flex-col gap-3" onSubmit={handleSubmit}>
        <div className="relative flex min-w-0 items-center">
          <IconType className="pointer-events-none absolute left-3 text-ink-faint" size={16} />
          <input
            aria-label="メールアドレス"
            autoComplete="username"
            className={FIELD}
            inputMode="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        <div className="relative flex min-w-0 items-center">
          <IconKey className="pointer-events-none absolute left-3 text-ink-faint" size={16} />
          <input
            aria-label="パスワード"
            autoComplete="current-password"
            className={FIELD}
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {error ? (
          <p
            className="flex min-w-0 items-start gap-2 text-danger text-meta [overflow-wrap:anywhere]"
            role="alert"
          >
            <IconAlert className="mt-px shrink-0" size={14} />
            <span>{error}</span>
          </p>
        ) : null}

        <button
          aria-label="ログイン"
          className="mt-1 flex h-12 items-center justify-center rounded-lg bg-brand text-brand-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={pending}
          title="ログイン"
          type="submit"
        >
          {pending ? <IconSync className="animate-spin" size={20} /> : <IconArrowRight size={20} />}
        </button>
      </form>
    </main>
  );
}
