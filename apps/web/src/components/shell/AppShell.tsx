import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { cx } from "@/lib/cx";

const LEFT_KEY = "onyx.panel.left";
const RIGHT_KEY = "onyx.panel.right";

/** Below this width the left panel is a drawer. Matches Tailwind `sm`. */
const PHONE = "(max-width: 639px)";
/** Below this width the right panel is an overlay. Matches Tailwind `lg`. */
const BELOW_DESKTOP = "(max-width: 1023px)";

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === "1") {
      return true;
    }
    if (raw === "0") {
      return false;
    }
  } catch {
    /* private mode / storage disabled — fall through to the default */
  }
  return fallback;
}

function writeFlag(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* private mode / storage disabled — nothing to persist */
  }
}

function matches(query: string): boolean {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/**
 * Restore the stored state, except on the breakpoints where the panel is an
 * overlay: an overlay must never be open on first paint.
 */
function initPanel(key: string, overlayQuery: string): boolean {
  if (matches(overlayQuery)) {
    return false;
  }
  return readFlag(key, true);
}

export interface AppShellContextValue {
  leftOpen: boolean;
  rightOpen: boolean;
  setLeftOpen: (open: boolean) => void;
  setRightOpen: (open: boolean) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
}

const NOOP_SHELL: AppShellContextValue = {
  leftOpen: true,
  rightOpen: true,
  setLeftOpen: () => undefined,
  setRightOpen: () => undefined,
  toggleLeft: () => undefined,
  toggleRight: () => undefined,
};

const AppShellContext = createContext<AppShellContextValue>(NOOP_SHELL);

/**
 * Panel state for anything rendered inside `<AppShell>` — `Header` uses it for
 * the drawer button and the right-panel toggle.
 */
export function useAppShell(): AppShellContextValue {
  return useContext(AppShellContext);
}

export interface AppShellProps {
  /** Rendered inside the provider, so it can call `useAppShell()`. */
  header: ReactNode;
  /** Vertical navigation, tablet and desktop only. */
  rail?: ReactNode;
  /** Bottom navigation, phone only. */
  tabBar?: ReactNode;
  /** File tree column / drawer. */
  left?: ReactNode;
  /** Outline + backlinks column / overlay / bottom sheet. */
  right?: ReactNode;
  /** The reading column. */
  children: ReactNode;
}

/**
 * Three-column reading shell.
 *
 * - phone   (<640)      one column, bottom tab bar, left = drawer, right = sheet
 * - tablet  (640–1023)  rail + left column + note, right = right-hand overlay
 * - desktop (>=1024)    rail + left + note + right, panels 1024–1319 narrowed
 *
 * Horizontal overflow is impossible by construction: the note column is the
 * only flexible track and carries `min-w-0`, panels are fixed-width flex items.
 */
export function AppShell({ header, rail, tabBar, left, right, children }: AppShellProps) {
  const [leftOpen, setLeftOpenState] = useState(() => initPanel(LEFT_KEY, PHONE));
  const [rightOpen, setRightOpenState] = useState(() => initPanel(RIGHT_KEY, BELOW_DESKTOP));

  const setLeftOpen = useCallback((open: boolean) => {
    setLeftOpenState(open);
    writeFlag(LEFT_KEY, open);
  }, []);

  const setRightOpen = useCallback((open: boolean) => {
    setRightOpenState(open);
    writeFlag(RIGHT_KEY, open);
  }, []);

  const toggleLeft = useCallback(() => setLeftOpen(!leftOpen), [leftOpen, setLeftOpen]);
  const toggleRight = useCallback(() => setRightOpen(!rightOpen), [rightOpen, setRightOpen]);

  // Esc closes whichever panel is currently floating above the note.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (rightOpen && matches(BELOW_DESKTOP)) {
        setRightOpen(false);
        return;
      }
      if (leftOpen && matches(PHONE)) {
        setLeftOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [leftOpen, rightOpen, setLeftOpen, setRightOpen]);

  const value = useMemo<AppShellContextValue>(
    () => ({
      leftOpen,
      rightOpen,
      setLeftOpen,
      setRightOpen,
      toggleLeft,
      toggleRight,
    }),
    [leftOpen, rightOpen, setLeftOpen, setRightOpen, toggleLeft, toggleRight],
  );

  return (
    <AppShellContext.Provider value={value}>
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-app text-ink">
        {header}

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {rail}

          {left ? (
            <aside
              className={cx(
                // phone: drawer clipped to the body row (above the tab bar)
                "absolute inset-y-0 left-0 z-30 flex w-[min(310px,88vw)] flex-col",
                "border-line border-r bg-panel shadow-panel transition-transform duration-200 ease-out",
                "pl-[env(safe-area-inset-left)]",
                leftOpen ? "translate-x-0" : "-translate-x-full",
                // tablet + desktop: static column
                "sm:static sm:z-auto sm:w-[var(--w-left)] sm:translate-x-0 sm:pl-0 sm:shadow-none",
                leftOpen ? "sm:flex" : "sm:hidden",
              )}
              inert={!leftOpen}
            >
              {left}
            </aside>
          ) : null}

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-app">{children}</main>

          {left && leftOpen ? (
            <button
              aria-label="ファイルツリーを閉じる"
              className="absolute inset-0 z-20 bg-scrim sm:hidden"
              onClick={() => setLeftOpen(false)}
              tabIndex={-1}
              type="button"
            />
          ) : null}

          {right && rightOpen ? (
            <button
              aria-label="サイドパネルを閉じる"
              className="absolute inset-0 z-20 bg-scrim lg:hidden"
              onClick={() => setRightOpen(false)}
              tabIndex={-1}
              type="button"
            />
          ) : null}

          {right ? (
            <aside
              className={cx(
                // phone: bottom sheet
                "absolute inset-x-0 bottom-0 z-30 flex max-h-[68%] flex-col",
                "rounded-t-xl border-line border-t bg-panel shadow-panel",
                // tablet: right-hand overlay
                "sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[min(332px,86vw)]",
                "sm:rounded-none sm:border-t-0 sm:border-l sm:pr-[env(safe-area-inset-right)]",
                // desktop: static column
                "lg:static lg:z-auto lg:w-[var(--w-right)] lg:pr-0 lg:shadow-none",
                rightOpen ? "flex" : "hidden",
              )}
              inert={!rightOpen}
            >
              <span
                aria-hidden="true"
                className="mx-auto mt-2 mb-0.5 h-1 w-9 flex-none rounded-full bg-line-strong sm:hidden"
              />
              {right}
            </aside>
          ) : null}
        </div>

        {tabBar}
      </div>
    </AppShellContext.Provider>
  );
}
