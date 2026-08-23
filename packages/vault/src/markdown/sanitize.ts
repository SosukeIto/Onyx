import { defaultSchema } from "rehype-sanitize";

type Schema = typeof defaultSchema;
type PropertyList = NonNullable<Schema["attributes"]>[string];

/** MathML / SVG elements emitted by KaTeX. */
const KATEX_TAGS = [
  "math",
  "semantics",
  "annotation",
  "annotation-xml",
  "mrow",
  "mi",
  "mn",
  "mo",
  "ms",
  "mspace",
  "mtext",
  "menclose",
  "merror",
  "mfrac",
  "mpadded",
  "mphantom",
  "mroot",
  "msqrt",
  "mstyle",
  "msub",
  "msup",
  "msubsup",
  "mmultiscripts",
  "mprescripts",
  "none",
  "mover",
  "munder",
  "munderover",
  "mtable",
  "mtr",
  "mtd",
  "mlabeledtr",
  "svg",
  "path",
  "line",
  "g",
];

/** Presentation attributes KaTeX puts on those elements. */
const KATEX_ATTRIBUTES: PropertyList = [
  "accent",
  "accentunder",
  "columnalign",
  "columnspacing",
  "columnspan",
  "d",
  "depth",
  "display",
  "displaystyle",
  "edge",
  "encoding",
  "fence",
  "height",
  "linethickness",
  "lspace",
  "mathbackground",
  "mathcolor",
  "mathvariant",
  "maxsize",
  "minsize",
  "notation",
  "preserveAspectRatio",
  "rowalign",
  "rowspacing",
  "rowspan",
  "rspace",
  "scriptlevel",
  "separator",
  "stretchy",
  "style",
  "viewBox",
  "voffset",
  "width",
  "x1",
  "x2",
  "y1",
  "y2",
  "xmlns",
];

const base = defaultSchema.attributes ?? {};
const globals: PropertyList = [
  "className",
  "id",
  "loading",
  "ariaHidden",
  "data*",
  ...(base["*"] ?? []),
];

const katexAttributes: Record<string, PropertyList> = {};
for (const tag of KATEX_TAGS) katexAttributes[tag] = KATEX_ATTRIBUTES;

/**
 * `defaultSchema` extended with everything the Obsidian renderer produces:
 * `class`, `id`, `data-*`, `loading` and the KaTeX element set.
 *
 * `clobberPrefix` is cleared so that heading ids match the slugs stored in
 * the index (`user-content-` would break every `[[note#heading]]` anchor).
 */
export const sanitizeSchema: Schema = {
  ...defaultSchema,
  clobberPrefix: "",
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "mark",
    "figure",
    "figcaption",
    "abbr",
    ...KATEX_TAGS,
  ],
  attributes: {
    ...base,
    ...katexAttributes,
    "*": globals,
    span: ["style", ...KATEX_ATTRIBUTES],
    div: ["style", ...(base.div ?? [])],
    img: ["loading", "decoding", ...(base.img ?? [])],
    // `className` must come first: `defaultSchema` restricts it on `a` to
    // the GFM footnote class, which would strip `wikilink`/`tag`.
    a: ["className", "href", "title", "target", "rel", ...(base.a ?? [])],
  },
};
