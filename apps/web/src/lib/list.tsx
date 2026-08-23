import type { ReactNode } from "react";

import { IconUnresolved } from "@/components/icons";

import { cx } from "./cx";

/**
 * Shared chrome for the list screens. `AppShell`'s `<main>` is
 * `overflow-hidden`, so every route owns its vertical scroll — that is what
 * `ScreenScroll` provides. The rows themselves come from
 * `components/list/NoteList`.
 */

export function ScreenScroll({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="onyx-scroll min-h-0 min-w-0 flex-1">
      <div
        className={cx(
          "mx-auto w-full min-w-0 max-w-[var(--w-read)] px-6 pt-5 pb-[22vh] max-sm:px-3 max-sm:pt-3",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Whole-screen placeholder: one glyph, no wording. */
export function EmptyScreen({ icon, children }: { icon: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-ink-faint">
      {icon}
      {children}
    </div>
  );
}

/** 404 for a note: the dead-link glyph and the path that was asked for. */
export function MissingScreen({ path }: { path: string }) {
  return (
    <EmptyScreen icon={<IconUnresolved size={42} strokeWidth={1.3} />}>
      <span className="max-w-full text-center text-ink-muted text-ui [overflow-wrap:anywhere]">
        {path}
      </span>
    </EmptyScreen>
  );
}
