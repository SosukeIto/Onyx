import type { ElementContent, Properties } from "hast";
import type { Blockquote, Paragraph, PhrasingContent, Root, RootContent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { parseWikilink, resolveAttachment, resolveLink } from "../links";
import { isImage } from "../scan";
import { slugify } from "../slug";
import { basename, extname } from "../text";
import type { VaultIndex } from "../types";

export interface ObsidianOptions {
  index: VaultIndex;
  fromPath: string;
  noteHref: (path: string) => string;
  fileHref: (path: string) => string;
  /** Renders the body of an embedded note; `null` stops the recursion. */
  renderEmbed: ((path: string) => ElementContent[]) | null;
}

const COMMENT = /%%[\s\S]*?%%/g;
const WIKILINK = /(!?)\[\[([^[\]\n]*)\]\]/g;
const HIGHLIGHT = /==([^=\n]+?)==/g;
const INLINE_TAG = /(^|[\s()[\]{}"'、。，．「」『』【】（）：;:,>|])#([\p{L}\p{N}_/-]+)/gu;
const CALLOUT = /^\[!([^\]\s]+)\]([+-]?)[ \t]*/;
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/** Marks nodes that must be lifted out of their wrapping paragraph. */
const BLOCK = "obsidianBlock";

type Builder = (match: RegExpExecArray) => PhrasingContent[] | null;

function text(value: string): PhrasingContent {
  return { type: "text", value };
}

/** A phrasing node rendered as an arbitrary element (via `hName`). */
function element(
  tagName: string,
  properties: Properties,
  children: PhrasingContent[],
): PhrasingContent {
  return {
    type: "emphasis",
    children,
    data: { hName: tagName, hProperties: properties },
  };
}

function replaceInText(
  nodes: PhrasingContent[],
  pattern: RegExp,
  build: Builder,
): PhrasingContent[] {
  // A fresh instance per call: embeds render nested documents re-entrantly
  // and would otherwise reset `lastIndex` of a shared global regex.
  const regex = new RegExp(pattern.source, pattern.flags);
  const out: PhrasingContent[] = [];
  for (const node of nodes) {
    if (node.type !== "text") {
      out.push(node);
      continue;
    }
    const value = node.value;
    const pieces: PhrasingContent[] = [];
    let last = 0;
    let matched = false;
    let match = regex.exec(value);
    while (match !== null) {
      const replacement = build(match);
      if (replacement) {
        matched = true;
        if (match.index > last) {
          pieces.push(text(value.slice(last, match.index)));
        }
        pieces.push(...replacement);
        last = match.index + match[0].length;
      }
      match = regex.exec(value);
    }
    if (!matched) {
      out.push(node);
      continue;
    }
    if (last < value.length) pieces.push(text(value.slice(last)));
    out.push(...pieces);
  }
  return out.filter((node) => node.type !== "text" || node.value.length > 0);
}

function wikilinkNodes(
  options: ObsidianOptions,
  isEmbed: boolean,
  inner: string,
): PhrasingContent[] | null {
  const parts = parseWikilink(inner);
  if (!parts) return null;
  const { index, fromPath, noteHref, fileHref } = options;

  if (isEmbed) {
    const ext = extname(parts.target);
    if (ext !== "" && ext !== "md") {
      const path = resolveAttachment(index, fromPath, inner);
      const label = parts.target;
      if (path === null) {
        return [
          element("span", { className: ["embed", "unresolved"], dataTarget: label }, [text(label)]),
        ];
      }
      if (isImage(path)) {
        return [
          {
            type: "image",
            url: fileHref(path),
            alt: label,
            data: { hProperties: { loading: "lazy", dataPath: path } },
          },
        ];
      }
      return [
        {
          type: "link",
          url: fileHref(path),
          children: [text(label)],
          data: { hProperties: { className: ["attachment"], dataPath: path } },
        },
      ];
    }

    const path = resolveLink(index, fromPath, parts.target);
    if (path === null) {
      return [
        element("div", { className: ["embed", "unresolved"], dataTarget: parts.target }, [
          text(parts.alias ?? parts.target),
        ]),
      ];
    }
    const children = options.renderEmbed ? options.renderEmbed(path) : [];
    const node: PhrasingContent = {
      type: "emphasis",
      children: [],
      data: {
        hName: "div",
        hProperties: { className: ["embed"], dataPath: path },
        hChildren: children,
      },
    };
    (node.data as Record<string, unknown>)[BLOCK] = true;
    return [node];
  }

  const path = resolveLink(index, fromPath, parts.target);
  if (path === null) {
    return [
      element("a", { className: ["wikilink", "unresolved"], dataTarget: parts.target }, [
        text(parts.alias ?? parts.target),
      ]),
    ];
  }
  const anchor = parts.heading ? `#${slugify(parts.heading)}` : "";
  return [
    {
      type: "link",
      url: `${noteHref(path)}${anchor}`,
      children: [text(parts.alias ?? basename(path, true))],
      data: { hProperties: { className: ["wikilink"], dataPath: path } },
    },
  ];
}

function tokenize(value: string, options: ObsidianOptions, allowTags: boolean): PhrasingContent[] {
  let nodes: PhrasingContent[] = [text(value)];
  nodes = replaceInText(nodes, COMMENT, () => []);
  nodes = replaceInText(nodes, WIKILINK, (match) =>
    wikilinkNodes(options, match[1] === "!", match[2] ?? ""),
  );
  nodes = replaceInText(nodes, HIGHLIGHT, (match) => [element("mark", {}, [text(match[1] ?? "")])]);
  if (allowTags) {
    nodes = replaceInText(nodes, INLINE_TAG, (match) => {
      const tag = (match[2] ?? "").replace(/\/+$/, "");
      if (!/[\p{L}]/u.test(tag)) return null;
      return [
        text(match[1] ?? ""),
        element("a", { className: ["tag"], dataTag: tag }, [text(`#${tag}`)]),
      ];
    });
  }
  return nodes;
}

interface RewrittenUrl {
  url: string;
  path: string;
  kind: "note" | "attachment";
}

function rewriteUrl(url: string, options: ObsidianOptions): RewrittenUrl | null {
  if (url === "" || ABSOLUTE.test(url)) return null;
  const hash = url.indexOf("#");
  const raw = hash === -1 ? url : url.slice(0, hash);
  const fragment = hash === -1 ? "" : url.slice(hash);
  let target = raw;
  try {
    target = decodeURIComponent(raw);
  } catch {
    target = raw;
  }
  const ext = extname(target);
  if (ext === "" || ext === "md") {
    const path = resolveLink(options.index, options.fromPath, target);
    if (path !== null) {
      return {
        url: `${options.noteHref(path)}${fragment}`,
        path,
        kind: "note",
      };
    }
  }
  const attachment = resolveAttachment(options.index, options.fromPath, target);
  if (attachment !== null) {
    return {
      url: options.fileHref(attachment),
      path: attachment,
      kind: "attachment",
    };
  }
  return null;
}

function transformCallouts(tree: Root): void {
  visit(tree, "blockquote", (node: Blockquote) => {
    const first = node.children[0];
    if (first?.type !== "paragraph") return;
    const lead = first.children[0];
    if (lead?.type !== "text") return;
    const match = CALLOUT.exec(lead.value);
    if (!match?.[1]) return;

    const kind = match[1].toLowerCase();
    const fold = match[2] ?? "";
    lead.value = lead.value.slice(match[0].length);

    const title: PhrasingContent[] = [];
    const rest: PhrasingContent[] = [];
    let inTitle = true;
    for (const child of first.children) {
      if (!inTitle) {
        rest.push(child);
        continue;
      }
      if (child.type === "break") {
        inTitle = false;
        continue;
      }
      if (child.type === "text" && child.value.includes("\n")) {
        const at = child.value.indexOf("\n");
        title.push(text(child.value.slice(0, at)));
        const after = child.value.slice(at + 1);
        if (after !== "") rest.push(text(after));
        inTitle = false;
        continue;
      }
      title.push(child);
    }
    const titleText = title
      .map((child) => ("value" in child ? child.value : ""))
      .join("")
      .trim();

    const titleParagraph: Paragraph = {
      type: "paragraph",
      children: titleText === "" ? [text(kind)] : title,
      data: { hProperties: { className: ["callout-title"] } },
    };
    const children: Blockquote["children"] = [titleParagraph];
    if (rest.length > 0) children.push({ type: "paragraph", children: rest });
    children.push(...node.children.slice(1));
    node.children = children;
    node.data = {
      ...node.data,
      hProperties: {
        className: ["callout"],
        dataCallout: kind,
        ...(fold === "" ? {} : { dataCalloutFold: fold }),
      },
    };
  });
}

interface WalkableParent {
  type: string;
  children: RootContent[] | PhrasingContent[];
}

function walk(node: WalkableParent, options: ObsidianOptions, inLink: boolean): void {
  const children = node.children as PhrasingContent[];
  const out: PhrasingContent[] = [];
  for (const child of children) {
    if (child.type === "text") {
      out.push(...tokenize(child.value, options, !inLink));
      continue;
    }
    if (child.type === "inlineCode" || child.type === "html") {
      out.push(child);
      continue;
    }
    if (child.type === "link" || child.type === "image") {
      const rewritten = rewriteUrl(child.url, options);
      if (rewritten !== null) {
        child.url = rewritten.url;
        child.data = {
          ...child.data,
          hProperties: {
            ...child.data?.hProperties,
            className: [
              rewritten.kind === "note"
                ? "wikilink"
                : child.type === "image"
                  ? "embed"
                  : "attachment",
            ],
            dataPath: rewritten.path,
            ...(child.type === "image" ? { loading: "lazy" } : {}),
          },
        };
      }
    }
    if ("children" in child && Array.isArray(child.children)) {
      walk(
        child as WalkableParent,
        options,
        inLink || child.type === "link" || child.type === "linkReference",
      );
    }
    out.push(child);
  }
  (node as { children: PhrasingContent[] }).children = out;
}

/** Pull `![[note]]` embeds out of the paragraph the parser wrapped them in. */
function liftBlockEmbeds(node: WalkableParent): void {
  const children = node.children as RootContent[];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) continue;
    if (
      child.type === "paragraph" &&
      child.children.length === 1 &&
      (child.children[0]?.data as Record<string, unknown> | undefined)?.[BLOCK] === true
    ) {
      const inner = child.children[0];
      children[i] = inner as unknown as RootContent;
      continue;
    }
    if ("children" in child && Array.isArray(child.children)) {
      liftBlockEmbeds(child as WalkableParent);
    }
  }
}

/**
 * Obsidian flavoured markdown: wikilinks, embeds, `==highlights==`,
 * callouts, inline `#tags` and `%%comments%%`.
 */
export const remarkObsidian: Plugin<[ObsidianOptions], Root> = (options) => {
  return (tree: Root) => {
    transformCallouts(tree);
    walk(tree, options, false);
    liftBlockEmbeds(tree);
  };
};
