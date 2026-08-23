/**
 * Static vault bundle: the contract (`./types`), the build step that produces
 * it (`./build`, node/Bun only) and the browser-side search over it
 * (`./client-search`).
 *
 * The web app should import `@Onyx/vault/static/types` or
 * `@Onyx/vault/static/client-search` directly so that `./build` — which pulls
 * in `node:fs` — never reaches a client bundle.
 */
export type { BuildStaticBundleOptions, BuildStaticBundleResult } from "./build";
export { ATTACHMENT_EXTENSIONS, buildStaticBundle } from "./build";
export type { ClientSearchOptions } from "./client-search";
export { searchDocs } from "./client-search";
export * from "./types";
