import type { NavKey } from "@/components/shell";

/** `01_Note/foo.md` → `01_Note/foo` (what the URL carries). */
export function stripMd(path: string): string {
  return path.replace(/\.md$/i, "");
}

/** `01_Note/foo` → `01_Note/foo.md` (what the index is keyed by). */
export function withMd(path: string): string {
  return /\.md$/i.test(path) ? path : `${path}.md`;
}

/** `01_Note/03_考え方/foo.md` → `01_Note/03_考え方` (`""` at the root). */
export function folderOf(path: string): string {
  const cut = path.lastIndexOf("/");
  return cut === -1 ? "" : path.slice(0, cut);
}

/** `01_Note/03_考え方/foo.md` → `foo`. */
export function baseNameOf(path: string): string {
  const cut = path.lastIndexOf("/");
  return stripMd(cut === -1 ? path : path.slice(cut + 1));
}

/** Which rail / tab-bar item is lit for a pathname. */
export function navKeyFor(pathname: string): NavKey {
  if (pathname === "/search" || pathname.startsWith("/search/")) {
    return "search";
  }
  if (pathname === "/daily" || pathname.startsWith("/daily/")) {
    return "daily";
  }
  if (pathname === "/graph" || pathname.startsWith("/graph/")) {
    return "graph";
  }
  if (pathname === "/logs" || pathname.startsWith("/logs/")) {
    return "logs";
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return "settings";
  }
  return "notes";
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local-time `YYYY-MM-DD` (never UTC — the daily note follows the user's day). */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `2026-08-23` → `{ year: 2026, month: 8 }`. */
export function monthOf(date: string): { year: number; month: number } | null {
  const [year, month] = date.split("-").map(Number);
  if (year === undefined || month === undefined) {
    return null;
  }
  return { year, month };
}

/** Month `+ delta`, wrapping the year. */
export function shiftMonth(
  value: { year: number; month: number },
  delta: number,
): { year: number; month: number } {
  const zero = value.year * 12 + (value.month - 1) + delta;
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
}

/**
 * ISO 8601 → `YYYY-MM-DD` in local time. Digits only: the UI carries no words,
 * so a date has to read as a number.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : toISODate(parsed);
}

/** ISO 8601 → `YYYY-MM-DD HH:mm` in local time. */
export function formatDateTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const time = `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  return `${toISODate(parsed)} ${time}`;
}

/** Git hashes are only ever shown short. */
export function shortCommit(value: string | null | undefined): string | null {
  return value ? value.slice(0, 7) : null;
}
