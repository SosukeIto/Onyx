import type { ReactNode } from "react";

import { IconFolder, IconMark, IconNote } from "@/components/icons";
import { cx } from "@/lib/cx";

/** `[start, end)` offsets into `SearchSnippet.text`. */
export type SearchRange = readonly [number, number];

export interface SearchSnippet {
  text: string;
  ranges: readonly SearchRange[];
}

/** Structural copy of `SearchHit` in `packages/vault/src/types.ts`. */
export interface SearchHit {
  path: string;
  title: string;
  count: number;
  snippets: readonly SearchSnippet[];
}

export interface SearchResultsProps {
  hits: readonly SearchHit[];
  /** Current query — used only to tint matches inside the title. */
  query?: string;
  onOpen?: (path: string) => void;
  activePath?: string;
  /** Snippet lines per hit. */
  snippetLimit?: number;
  className?: string;
}

function folderOf(path: string): string {
  const cut = path.lastIndexOf("/");
  return cut === -1 ? "" : path.slice(0, cut);
}

/**
 * Split `text` at `ranges` and wrap the matches in `<mark>`. Everything stays a
 * React text node, so snippet text coming from the vault is never parsed as
 * HTML. Out-of-order, overlapping and out-of-bounds ranges are tolerated.
 */
function highlight(text: string, ranges: readonly SearchRange[]): ReactNode[] {
  const sorted = [...ranges]
    .map(([start, end]): SearchRange => [
      Math.max(0, Math.min(start, text.length)),
      Math.max(0, Math.min(end, text.length)),
    ])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  const out: ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of sorted) {
    if (start < cursor) {
      continue;
    }
    if (start > cursor) {
      out.push(text.slice(cursor, start));
    }
    out.push(
      <mark
        className="rounded-[2px] bg-mark px-0.5 font-medium text-mark-foreground"
        key={`${start}-${end}`}
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  if (cursor < text.length) {
    out.push(text.slice(cursor));
  }
  return out;
}

/**
 * Plain, case-insensitive substring ranges. Used for the title only — the
 * server sends real ranges for snippets, and a literal scan cannot produce a
 * wrong-looking highlight the way a client-side regex would.
 */
function literalRanges(text: string, query: string): SearchRange[] {
  if (!query) {
    return [];
  }
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  const found: SearchRange[] = [];
  let from = 0;
  while (found.length < 40) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) {
      break;
    }
    found.push([at, at + needle.length]);
    from = at + needle.length;
  }
  return found;
}

/**
 * Search hit list (`.res-list` in docs/demo.html): title, dimmed path, hit
 * count and up to `snippetLimit` snippet lines per file.
 */
export function SearchResults({
  hits,
  query = "",
  onOpen,
  activePath,
  snippetLimit = 2,
  className,
}: SearchResultsProps) {
  return (
    <div className={cx("min-w-0 max-w-[880px] px-5 pt-3 pb-[20vh]", className)}>
      {hits.map((hit) => {
        const active = hit.path === activePath;
        const folder = folderOf(hit.path);
        return (
          <button
            aria-current={active ? "page" : undefined}
            className={cx(
              "mb-0.5 block w-full min-w-0 rounded-lg border px-3.5 py-3 text-left transition-colors",
              active
                ? "border-line bg-brand-soft"
                : "border-transparent hover:border-line hover:bg-panel",
            )}
            key={hit.path}
            onClick={() => onOpen?.(hit.path)}
            title={hit.path}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-2">
              <IconNote className="flex-none text-ink-faint" size={16} strokeWidth={1.6} />
              <span className="min-w-0 flex-1 truncate font-medium text-[15px] text-ink">
                {highlight(hit.title, literalRanges(hit.title, query))}
              </span>
              <span
                className="flex flex-none items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-ink-muted text-micro tabular-nums"
                title={`一致した箇所 ${hit.count}`}
              >
                <IconMark size={12} strokeWidth={1.6} />
                {hit.count}
              </span>
            </span>

            {folder ? (
              <span className="mt-1 ml-[26px] flex min-w-0 items-center gap-1 text-ink-faint text-micro">
                <IconFolder className="flex-none" size={14} strokeWidth={1.6} />
                <span className="min-w-0 truncate">{folder}</span>
              </span>
            ) : null}

            {hit.snippets.slice(0, snippetLimit).map((snippet, index) => (
              <span
                className="mt-[5px] ml-[26px] block border-line border-l-2 pl-3 text-ink-muted text-meta leading-[1.8] [overflow-wrap:anywhere]"
                key={`${hit.path}-s${index}`}
              >
                {highlight(snippet.text, snippet.ranges)}
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}
