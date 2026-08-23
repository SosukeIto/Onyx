import { cloudflare } from "@cloudflare/vite-plugin";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { type ManifestOptions, VitePWA, type VitePluginPWAAPI } from "vite-plugin-pwa";
import { defineConfig, type Plugin } from "vite";

/** クライアントビルドの出力先(Cloudflare の静的アセット配信ルート)。 */
const CLIENT_OUT_DIR = "dist/client";

/** SSR 環境名。Cloudflare プラグインと SW 生成プラグインで同じ値を使う。 */
const SSR_ENVIRONMENT = "ssr";

/** src/styles/tokens.css のダーク `--bg-app`。 */
const THEME_COLOR = "#17181c";

/** Web App Manifest。 */
const manifest: Partial<ManifestOptions> = {
  name: "Onyx",
  short_name: "Onyx",
  description: "Obsidian vault (SosukeIto/my-vault) の Web ビューア",
  lang: "ja",
  dir: "ltr",
  display: "standalone",
  start_url: "/",
  scope: "/",
  id: "/",
  theme_color: THEME_COLOR,
  background_color: THEME_COLOR,
  categories: ["productivity", "utilities"],
  icons: [
    {
      src: "/pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/pwa-maskable-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

/**
 * PWA。
 *
 * TanStack Start は index.html を持たない SSR アプリなので、
 * - マニフェスト / アイコンの <link> は src/routes/__root.tsx で手書きする
 * - Service Worker の登録は virtual:pwa-register(components/pwa-register.tsx)で行う
 * ため injectRegister は null にしている。
 *
 * また Vite の環境 API 下では build.outDir がトップレベル設定("dist")のままなので、
 * outDir を明示してクライアント成果物(dist/client)に対して SW を生成させる。
 */
const pwa = VitePWA({
  outDir: CLIENT_OUT_DIR,
  registerType: "autoUpdate",
  injectRegister: null,
  manifestFilename: "manifest.webmanifest",
  // アイコンは globPatterns("*.png")で拾うので、マニフェスト由来の重複登録は切る
  includeManifestIcons: false,
  manifest,
  workbox: {
    // ハッシュ付きの JS/CSS とアイコン・オフライン案内だけをプリキャッシュする。
    // HTML は SSR で毎回生成されるためプリキャッシュ対象にしない。
    // vault バンドル(/vault/**)と添付(/files/**)は認証が要るので入れない。
    globPatterns: ["assets/**/*.{js,css}", "*.{png,svg,ico}", "offline.html"],
    globIgnores: ["vault/**", "files/**"],
    // ★重要: vite-plugin-pwa の既定値 "index.html" を必ず打ち消す。
    // navigateFallback を有効にすると NavigationRoute がすべての遷移を横取りし、
    // SSR のレスポンス(未ログイン時の /login への 307 など)が届かなくなる。
    navigateFallback: undefined,
    // vault バンドルは万単位のファイルになりうるので上限を上げておく。
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        // ★認証エンドポイントと server function は絶対にキャッシュしない。
        // (POST は Workbox のルーターが GET しか登録しないためそもそも素通り)
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin &&
          (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn/")),
        handler: "NetworkOnly",
      },
      {
        // vault の JSON と添付はセッションに紐づくので共有キャッシュに載せない。
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && (url.pathname.startsWith("/vault/") || url.pathname.startsWith("/files/")),
        handler: "NetworkOnly",
      },
      {
        // ページ遷移は NetworkFirst。オフラインならキャッシュ済みページ、
        // それも無ければプリキャッシュした /offline.html を返す。
        urlPattern: ({ request, url, sameOrigin }) =>
          sameOrigin &&
          request.mode === "navigate" &&
          !url.pathname.startsWith("/api/") &&
          !url.pathname.startsWith("/_serverFn/"),
        handler: "NetworkFirst",
        options: {
          cacheName: "onyx-pages",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24 * 7,
            purgeOnQuotaError: true,
          },
          precacheFallback: { fallbackURL: "/offline.html" },
          plugins: [
            {
              // ★200 かつリダイレクトを経ていない同一オリジンのレスポンスだけ保存する。
              // 未ログインで "/" を開くと 307 → /login になるが、それを "/" のキャッシュとして
              // 保存するとログイン後もログイン画面が出続けるため弾く。
              cacheWillUpdate: ({ response }) =>
                Promise.resolve(
                  response.status === 200 && response.type === "basic" && !response.redirected
                    ? response
                    : null,
                ),
            },
          ],
        },
      },
    ],
  },
  devOptions: {
    // 開発サーバーでは SW を動かさない(HMR とキャッシュが噛み合わないため)。
    enabled: false,
  },
});

/**
 * 開発サーバーで /manifest.webmanifest を返すだけのプラグイン。
 *
 * vite-plugin-pwa がマニフェストを配信するのは devOptions.enabled のときだけで、
 * 開発時に SW を動かすと HMR と噛み合わないので無効にしている。その代わりに
 * ここでマニフェストだけを返し、__root.tsx の <link rel="manifest"> が
 * 開発中に 404 にならないようにする(SW は本番ビルドでのみ動く)。
 */
const pwaDevManifest: Plugin = {
  name: "onyx:pwa-dev-manifest",
  apply: "serve",
  enforce: "pre",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith("/manifest.webmanifest")) {
        next();
        return;
      }
      res.setHeader("Content-Type", "application/manifest+json");
      res.end(JSON.stringify(manifest));
    });
  },
};

/**
 * Service Worker(dist/client/sw.js)を生成する後処理プラグイン。
 *
 * vite-plugin-pwa 1.3.0 は Vite の環境 API に未対応で、`configResolved` が
 * shared → client → ssr の順に 3 回呼ばれた結果 `viteConfig.build.ssr === true` を
 * 掴んだままになり、自前の closeBundle での SW 生成をスキップしてしまう
 * (TanStack/router#4988)。そこでプラグインが公開している API を使い、
 * 最後に走る ssr 環境の closeBundle で明示的に generateSW() を呼ぶ。
 * この時点で dist/client は public/ のコピーまで含めて書き出し済み。
 */
const pwaGenerateSW: Plugin = {
  name: "onyx:pwa-generate-sw",
  apply: "build",
  enforce: "post",
  applyToEnvironment: (environment) => environment.name === SSR_ENVIRONMENT,
  closeBundle: {
    sequential: true,
    order: "post",
    async handler() {
      const api = pwa.find((plugin) => plugin.name === "vite-plugin-pwa")?.api as
        | VitePluginPWAAPI
        | undefined;
      if (!api || api.disabled) return;
      await api.generateSW();
    },
  },
};

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: SSR_ENVIRONMENT } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    pwa,
    pwaGenerateSW,
    pwaDevManifest,
  ],
});

export default config;
