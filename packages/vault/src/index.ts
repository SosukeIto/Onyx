/**
 * Public API of @Onyx/vault.
 *
 * The signatures below are the contract consumed by apps/server and
 * packages/api. Implementations live in the sibling modules.
 */

export type { BuildIndexOptions } from "./build";
export { buildIndex } from "./build";
export { resolveAttachment, resolveLink } from "./links";
export type { RenderOptions } from "./markdown/render";
export {
	defaultFileHref,
	defaultNoteHref,
	renderBody,
	renderNote,
} from "./markdown/render";
export type { SearchOptions } from "./search";
export { search } from "./search";
export * from "./types";
