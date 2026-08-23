import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import { Frontmatter } from "./Frontmatter";
import { NoteBody } from "./NoteBody";

export interface NoteViewProps {
  frontmatter?: Record<string, unknown>;
  /** Sanitized HTML from `@Onyx/vault`'s renderNote(). */
  html: string;
  onLinkClick?: (path: string) => void;
  onTagClick?: (tag: string) => void;
  /** Widen the reading column (tables, wide code). */
  wide?: boolean;
  /** Slot above the property block. */
  header?: ReactNode;
  /**
   * Pin `header` to the top of the reading column while the note scrolls
   * under it. The band spans the full reading measure (`--w-read`) and keeps
   * the column's own gutters, so its contents stay aligned with the body.
   */
  stickyHeader?: boolean;
  className?: string;
}

/**
 * The reading column: property block + note body, centred on a measure of
 * `--w-read` (760px desktop, 680px on narrow desktops, full width below).
 */
export function NoteView({
  frontmatter,
  html,
  onLinkClick,
  onTagClick,
  wide,
  header,
  stickyHeader,
  className,
}: NoteViewProps) {
  return (
    <div className={cx("onyx-scroll min-h-0 min-w-0 flex-1", className)}>
      <div
        className={cx(
          "mx-auto w-full min-w-0 px-8 pb-[30vh] max-sm:px-4 max-sm:pb-[22vh] max-lg:px-6 max-lg:pb-[24vh]",
          // A sticky band sits flush with the top of the scroller, so the
          // column loses the padding the band replaces.
          stickyHeader && header ? "pt-0" : "pt-8 max-sm:pt-4",
          wide ? "max-w-[900px]" : "max-w-[var(--w-read)]",
        )}
      >
        {header ? (
          <div
            className={cx(
              "min-w-0",
              stickyHeader &&
                "sticky top-0 z-10 -mx-8 mb-4 border-line border-b bg-app px-8 pt-3 pb-2 max-sm:-mx-4 max-sm:mb-3 max-sm:px-4 max-lg:-mx-6 max-lg:px-6",
            )}
          >
            {header}
          </div>
        ) : null}
        <Frontmatter frontmatter={frontmatter} onTagClick={onTagClick} />
        <NoteBody html={html} onLinkClick={onLinkClick} onTagClick={onTagClick} />
      </div>
    </div>
  );
}
