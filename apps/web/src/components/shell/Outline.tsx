import type { Heading } from "@Onyx/vault";

import { cx } from "@/lib/cx";

export interface OutlineProps {
  headings?: readonly Heading[];
  /** Slug of the heading currently in view. */
  activeSlug?: string;
  onSelect?: (slug: string) => void;
}

/** Heading list of the open note. The heading text is note content, so it stays. */
export function Outline({ headings, activeSlug, onSelect }: OutlineProps) {
  if (!headings || headings.length === 0) {
    return null;
  }
  return (
    <div className="min-w-0">
      {headings.map((heading) => {
        const active = heading.slug === activeSlug;
        return (
          <button
            aria-current={active ? "location" : undefined}
            className={cx(
              "flex h-[25px] w-full min-w-0 items-center rounded-md pr-1.5 text-left text-ink-muted text-meta transition-colors hover:bg-hover hover:text-ink max-sm:h-8",
              heading.depth === 1 && "font-medium text-ink",
              active && "bg-brand-soft text-brand hover:bg-brand-soft",
            )}
            key={heading.slug}
            onClick={() => onSelect?.(heading.slug)}
            style={{ paddingLeft: `${4 + (heading.depth - 1) * 13}px` }}
            title={heading.text}
            type="button"
          >
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {heading.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
