import { useEffect } from "react";

/**
 * Service Worker を登録するクライアント専用コンポーネント。
 *
 * `virtual:pwa-register` は vite-plugin-pwa が生成する仮想モジュール。
 * SSR 中に評価されないよう useEffect の中で動的 import する。
 * registerType は "autoUpdate" なので、新しい SW が有効化されると
 * ページが自動的にリロードされる。
 *
 * DOM は出力しない(<head> のリンク類は __root.tsx 側で SSR している)。
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let disposed = false;
    void import("virtual:pwa-register").then(({ registerSW }) => {
      if (disposed) return;
      registerSW({ immediate: true });
    });

    return () => {
      disposed = true;
    };
  }, []);

  return null;
}
