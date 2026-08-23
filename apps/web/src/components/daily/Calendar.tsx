// biome-ignore-all lint/a11y/useSemanticElements: the WAI-ARIA date-picker grid is built from roles; a data table would misdescribe it
// biome-ignore-all lint/a11y/useFocusableInteractive: grid / row / columnheader are structure only — focus lives on the day cells via a roving tabindex

import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { IconChevronLeft, IconChevronRight, IconTarget } from "@/components/icons";
import { IconButton } from "@/components/shell";
import { cx } from "@/lib/cx";

export interface CalendarDay {
  /** `YYYY-MM-DD`. */
  date: string;
  /** Vault path of the daily note for that date. */
  path: string;
}

export interface CalendarProps {
  /** Four-digit year. */
  year: number;
  /** 1–12. */
  month: number;
  /** Days of this month that have a note. Every other day renders dimmed. */
  days: readonly CalendarDay[];
  /** `YYYY-MM-DD` of the note currently open. */
  selected?: string;
  onSelect?: (date: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  /** `YYYY-MM-DD` of today — drawn with a ring. */
  today?: string;
  /** Optional "jump to today" control; the button is hidden without it. */
  onToday?: () => void;
  className?: string;
}

/** 日〜土 — single glyphs, the one place weekday wording is allowed. */
const DOW = ["日", "月", "火", "水", "木", "金", "土"] as const;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Month grid of daily notes (`.cal` in docs/demo.html).
 *
 * Pure presentation: it never reads the clock, so the route owns `year` /
 * `month` / `today` and this only reports intent.
 *
 * Keyboard: roving tabindex across the month, arrows move by day / week,
 * Home and End jump to the first and last day, PageUp / PageDown change month,
 * Enter and Space open the focused day when it has a note. Days without a note
 * stay focusable (`aria-disabled`) so arrow keys can cross them.
 */
export function Calendar({
  year,
  month,
  days,
  selected,
  onSelect,
  onPrevMonth,
  onNextMonth,
  today,
  onToday,
  className,
}: CalendarProps) {
  const total = daysInMonth(year, month);
  const lead = firstWeekday(year, month);
  const label = `${year}-${pad(month)}`;

  const withNote = new Set(days.map((entry) => entry.date));
  const selectedDay = selected?.startsWith(`${label}-`) ? Number(selected.slice(8)) : undefined;
  const todayDay = today?.startsWith(`${label}-`) ? Number(today.slice(8)) : undefined;
  const firstWithNote = days.length > 0 ? Number(days[0].date.slice(8)) : 1;

  const [focusDay, setFocusDay] = useState(selectedDay ?? todayDay ?? firstWithNote);
  const cellRefs = useRef(new Map<number, HTMLButtonElement>());
  const pendingFocus = useRef(false);
  const roving = clamp(focusDay, 1, total);

  useEffect(() => {
    if (!pendingFocus.current) {
      return;
    }
    pendingFocus.current = false;
    cellRefs.current.get(roving)?.focus();
  }, [roving]);

  function move(next: number) {
    pendingFocus.current = true;
    setFocusDay(clamp(next, 1, total));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, at: number) {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        move(at - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        move(at + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(at - 7);
        break;
      case "ArrowDown":
        event.preventDefault();
        move(at + 7);
        break;
      case "Home":
        event.preventDefault();
        move(1);
        break;
      case "End":
        event.preventDefault();
        move(total);
        break;
      case "PageUp":
        event.preventDefault();
        onPrevMonth?.();
        break;
      case "PageDown":
        event.preventDefault();
        onNextMonth?.();
        break;
      case "Enter":
      case " ": {
        const date = ymd(year, month, at);
        event.preventDefault();
        if (withNote.has(date)) {
          onSelect?.(date);
        }
        break;
      }
      default:
        break;
    }
  }

  const weeks = Math.ceil((lead + total) / 7);
  const rows = Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (__, column) => {
      const value = week * 7 + column - lead + 1;
      return value >= 1 && value <= total ? value : null;
    }),
  );

  return (
    <div className={cx("min-w-0 px-3 pt-2 pb-4", className)}>
      <div className="mb-2 flex min-w-0 items-center gap-0.5">
        <span className="min-w-0 flex-1 truncate font-bold text-ink text-ui tabular-nums">
          {label}
        </span>
        <IconButton
          label={`${label} の前の月`}
          onClick={onPrevMonth}
          size="sm"
          title={`${label} の前の月`}
        >
          <IconChevronLeft size={16} strokeWidth={1.6} />
        </IconButton>
        <IconButton
          label={`${label} の次の月`}
          onClick={onNextMonth}
          size="sm"
          title={`${label} の次の月`}
        >
          <IconChevronRight size={16} strokeWidth={1.6} />
        </IconButton>
        {onToday ? (
          <IconButton label="今日へ" onClick={onToday} size="sm" title="今日へ">
            <IconTarget size={16} strokeWidth={1.6} />
          </IconButton>
        ) : null}
      </div>

      <div aria-label={label} className="min-w-0" role="grid">
        <div className="grid grid-cols-7 gap-0.5" role="row">
          {DOW.map((name, index) => (
            <div
              className={cx(
                "py-1 text-center text-[10px] text-ink-faint",
                index === 0 && "text-danger",
                index === 6 && "text-link",
              )}
              key={name}
              role="columnheader"
            >
              {name}
            </div>
          ))}
        </div>
        {rows.map((row, week) => (
          <div className="grid grid-cols-7 gap-0.5" key={`${label}-w${week}`} role="row">
            {row.map((value, column) => {
              if (value === null) {
                return (
                  <div
                    className="min-h-[30px]"
                    key={`${label}-w${week}-${column}`}
                    role="gridcell"
                  />
                );
              }
              const date = ymd(year, month, value);
              const has = withNote.has(date);
              const isSelected = date === selected;
              return (
                <button
                  aria-current={isSelected ? "page" : undefined}
                  aria-disabled={has ? undefined : true}
                  aria-label={date}
                  className={cx(
                    "relative flex aspect-square min-h-[30px] min-w-0 items-center justify-center rounded-md text-meta tabular-nums transition-colors",
                    has
                      ? "cursor-pointer text-ink hover:bg-hover"
                      : "cursor-default text-ink-faint opacity-55",
                    value === todayDay &&
                      !isSelected &&
                      "shadow-[inset_0_0_0_1.5px_var(--border-strong)]",
                    isSelected && "bg-brand font-bold text-brand-contrast hover:bg-brand",
                  )}
                  key={date}
                  onClick={() => {
                    if (has) {
                      onSelect?.(date);
                    }
                  }}
                  onKeyDown={(event) => handleKeyDown(event, value)}
                  ref={(node) => {
                    if (node) {
                      cellRefs.current.set(value, node);
                    } else {
                      cellRefs.current.delete(value);
                    }
                  }}
                  role="gridcell"
                  tabIndex={value === roving ? 0 : -1}
                  type="button"
                >
                  {value}
                  {has ? (
                    <span
                      aria-hidden="true"
                      className={cx(
                        "absolute bottom-[5px] size-1 rounded-full",
                        isSelected ? "bg-brand-contrast opacity-90" : "bg-brand opacity-75",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-1.5 px-1 pt-2.5 text-ink-muted text-micro tabular-nums"
        title={`${label} のノートがある日 / 日数`}
      >
        <span aria-hidden="true" className="size-[5px] rounded-full bg-brand" />
        <span>
          {days.length} / {total}
        </span>
      </div>
    </div>
  );
}
