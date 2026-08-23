import { Fragment, type ReactNode, useEffect } from "react";

import {
  IconArrowLeft,
  IconArrowRight,
  IconChevron,
  IconLogo,
  IconMenu,
  IconPanelRight,
  IconSync,
} from "@/components/icons";
import { ModeToggle } from "@/components/mode-toggle";
import { cx } from "@/lib/cx";

import { useAppShell } from "./AppShell";
import { IconButton } from "./IconButton";
import { Tooltip } from "./Tooltip";

export interface BreadcrumbSegment {
  /** Folder or file name. One of the few places real text is allowed. */
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface SyncState {
  /** Formatted timestamp, e.g. `2026-08-22 08:35`. Shown in the tooltip only. */
  syncedAt?: string | null;
  /** Short commit hash. */
  commit?: string | null;
  syncing?: boolean;
  error?: string | null;
}

export interface HeaderProps {
  /** Tooltip on the logo button. Defaults to the vault repo name. */
  vaultName?: string;
  onLogoClick?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  /** Path of the open note, root first, file last. */
  segments?: BreadcrumbSegment[];
  /** Override a crumb, e.g. to wrap it in a TanStack Router `<Link>`. */
  renderSegment?: (segment: BreadcrumbSegment, index: number, isLast: boolean) => ReactNode;
  /**
   * How many crumbs may stay on screen, the `…` placeholder included. Deep
   * paths lose their leading folders first; the file name is never dropped.
   */
  maxSegments?: number;
  sync?: SyncState;
  /** Extra controls, inserted left of the theme toggle. */
  actions?: ReactNode;
}

interface Crumb {
  segment: BreadcrumbSegment;
  /** Index in the original `segments`, so `renderSegment` stays addressable. */
  index: number;
}

/**
 * Keep the tail of the path — the file name matters most, its folder next.
 * Everything in front is returned as `hidden` and collapses into one `…`.
 */
function collapseSegments(
  segments: BreadcrumbSegment[],
  maxSegments: number,
): { crumbs: Crumb[]; hidden: BreadcrumbSegment[] } {
  const all = segments.map((segment, index) => ({ index, segment }));
  if (segments.length <= maxSegments) {
    return { crumbs: all, hidden: [] };
  }
  // One slot goes to the `…` placeholder.
  const keep = Math.max(1, maxSegments - 1);
  return {
    crumbs: all.slice(all.length - keep),
    hidden: segments.slice(0, segments.length - keep),
  };
}

function syncDotClass(sync: SyncState): string {
  if (sync.error) {
    return "bg-danger";
  }
  if (sync.syncing) {
    return "animate-pulse bg-warn";
  }
  if (sync.syncedAt || sync.commit) {
    return "bg-ok";
  }
  return "bg-line-strong";
}

function syncTooltip(sync: SyncState): string {
  if (sync.error) {
    return `同期エラー: ${sync.error}`;
  }
  if (sync.syncing) {
    return "同期中";
  }
  const parts = [sync.syncedAt, sync.commit].filter(Boolean);
  return parts.length > 0 ? `同期済み ${parts.join(" · ")}` : "未同期";
}

export function Header({
  vaultName = "my-vault",
  onLogoClick,
  canGoBack = false,
  canGoForward = false,
  onBack,
  onForward,
  segments = [],
  renderSegment,
  maxSegments = 3,
  sync = {},
  actions,
}: HeaderProps) {
  const { leftOpen, rightOpen, toggleLeft, toggleRight } = useAppShell();

  // Alt+←/→ mirrors the browser's own history shortcuts.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey) {
        return;
      }
      if (event.key === "ArrowLeft" && canGoBack) {
        event.preventDefault();
        onBack?.();
      }
      if (event.key === "ArrowRight" && canGoForward) {
        event.preventDefault();
        onForward?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGoBack, canGoForward, onBack, onForward]);

  const tooltip = syncTooltip(sync);
  const { crumbs, hidden } = collapseSegments(segments, maxSegments);

  return (
    <header className="relative z-30 flex h-[var(--h-header)] min-w-0 flex-none items-center gap-3 border-line border-b bg-panel pr-[max(12px,env(safe-area-inset-right))] pl-[max(12px,env(safe-area-inset-left))] max-sm:gap-0.5">
      <IconButton
        aria-expanded={leftOpen}
        className="sm:hidden"
        label="ファイルツリーを開閉"
        onClick={toggleLeft}
      >
        <IconMenu size={20} />
      </IconButton>

      <Tooltip label={vaultName}>
        <button
          aria-label={`vault のルート ${vaultName}`}
          className="grid size-[34px] flex-none place-items-center rounded-md text-brand transition-colors hover:bg-hover max-sm:size-8"
          onClick={onLogoClick}
          type="button"
        >
          <IconLogo size={24} strokeWidth={1.6} />
        </button>
      </Tooltip>

      <div className="flex flex-none items-center">
        <Tooltip label="戻る">
          <IconButton disabled={!canGoBack} label="前に見ていた画面に戻る" onClick={onBack}>
            <IconArrowLeft size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip className="max-sm:hidden" label="進む">
          <IconButton disabled={!canGoForward} label="次の画面に進む" onClick={onForward}>
            <IconArrowRight size={20} />
          </IconButton>
        </Tooltip>
      </div>

      <span aria-hidden="true" className="h-5 w-px flex-none bg-line max-sm:hidden" />

      <nav
        aria-label="開いているファイルのパス"
        className="flex min-w-0 flex-1 items-center gap-0.5 text-ink-muted text-meta"
      >
        {hidden.length > 0 ? (
          <Fragment key="onyx-crumb-ellipsis">
            <IconChevron
              className="flex-none text-ink-faint max-sm:hidden"
              size={14}
              strokeWidth={1.6}
            />
            <span
              className="flex-none text-ink-faint max-sm:hidden"
              title={hidden.map((s) => s.label).join("/")}
            >
              …
            </span>
          </Fragment>
        ) : null}

        {crumbs.map(({ segment, index }) => {
          const isLast = index === segments.length - 1;
          const key = segments
            .slice(0, index + 1)
            .map((s) => s.label)
            .join("/");
          const custom = renderSegment?.(segment, index, isLast);
          const content = custom ?? (
            <span
              className={cx(
                "overflow-hidden text-ellipsis whitespace-nowrap",
                isLast
                  ? "min-w-[60px] shrink font-medium text-ink max-sm:min-w-0 max-sm:text-ui"
                  : "max-w-[22ch] flex-none max-sm:hidden max-lg:max-w-[14ch]",
              )}
              title={segment.label}
            >
              {segment.label}
            </span>
          );
          return (
            <Fragment key={key}>
              <IconChevron
                className="flex-none text-ink-faint max-sm:hidden"
                size={14}
                strokeWidth={1.6}
              />
              {content}
            </Fragment>
          );
        })}
      </nav>

      <div className="ml-auto flex flex-none items-center gap-2">
        <Tooltip align="end" label={tooltip}>
          <span
            aria-label={tooltip}
            className="flex h-7 flex-none items-center gap-[5px] rounded-full border border-line bg-elev px-[9px] text-ink-muted max-sm:h-10 max-sm:w-7 max-sm:justify-center max-sm:border-0 max-sm:bg-transparent max-sm:px-0"
            role="img"
          >
            <span
              className={cx(
                "size-[7px] flex-none rounded-full max-sm:size-[9px]",
                syncDotClass(sync),
              )}
            />
            <IconSync
              className={cx("max-sm:hidden", sync.syncing && "animate-spin")}
              size={14}
              strokeWidth={1.6}
            />
          </span>
        </Tooltip>

        {actions}

        <Tooltip align="end" label="アウトライン / バックリンク">
          <IconButton active={rightOpen} label="右サイドバーを開閉" onClick={toggleRight}>
            <IconPanelRight size={20} />
          </IconButton>
        </Tooltip>

        <ModeToggle />
      </div>
    </header>
  );
}
