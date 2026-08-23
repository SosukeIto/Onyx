import GithubSlugger, { slug as githubSlug } from "github-slugger";

/**
 * Heading slug. Uses the exact same implementation as `rehype-slug`, so the
 * anchors produced by the renderer always match the slugs stored in the
 * index (including Japanese headings, which are kept verbatim).
 */
export function slugify(text: string): string {
  return githubSlug(text);
}

/** A stateful slugger that appends `-1`, `-2`, … to duplicate headings. */
export function createSlugger(): GithubSlugger {
  return new GithubSlugger();
}
