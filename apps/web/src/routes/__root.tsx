import { Toaster } from "@Onyx/ui/components/sonner";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";

import { IconUnresolved } from "@/components/icons";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import { errorText } from "@/lib/errors";

import appCss from "../index.css?url";

/** Dark `--bg-app` from src/styles/tokens.css — the colour the OS chrome takes. */
const THEME_COLOR = "#17181c";

export interface RouterAppContext {
  queryClient: QueryClient;
}

/**
 * The HTML document itself, and nothing else.
 *
 * Every screen of the app lives under the `_app` layout route, which is where
 * the reading shell (rail, panels, header) and the session guard are. `/login`
 * is the one route outside it, so this file must stay free of anything that
 * assumes a logged-in reader.
 */
export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        // viewport-fit=cover + env(safe-area-inset-*) でノッチ / ホームバーに対応
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { name: "theme-color", content: THEME_COLOR },
      {
        name: "description",
        content: "Obsidian vault (SosukeIto/my-vault) の Web ビューア",
      },
      // --- PWA / ホーム画面追加 ---
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      { name: "apple-mobile-web-app-title", content: "Onyx" },
      { name: "application-name", content: "Onyx" },
      { title: "Onyx" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@400;500;700&family=M+PLUS+1+Code:wght@400;500&display=swap",
      },
      // vite-plugin-pwa が dist/client/manifest.webmanifest を生成する。
      // TanStack Start には index.html が無いため、ここで手動でリンクする。
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      {
        // iOS はここで指定した PNG をホーム画面アイコンに使う(角丸は OS が付ける)
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
  }),
  errorComponent: RootErrorScreen,
  shellComponent: RootDocument,
});

/** Anything the route boundaries below did not catch. One glyph, one line. */
function RootErrorScreen({ error }: ErrorComponentProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-app px-6 text-ink-faint">
      <IconUnresolved size={42} strokeWidth={1.3} />
      <span className="max-w-full text-center text-ink-muted text-ui [overflow-wrap:anywhere]">
        {errorText(error)}
      </span>
    </div>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // next-themes writes the theme class onto <html> before hydration.
    <html lang="ja" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-app text-ink">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
          storageKey="onyx-theme"
        >
          {children}
          <Toaster richColors />
        </ThemeProvider>
        <PwaRegister />
        <TanStackDevtools
          config={{ position: "bottom-right" }}
          plugins={[
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
