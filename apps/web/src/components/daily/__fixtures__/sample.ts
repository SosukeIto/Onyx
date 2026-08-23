/**
 * Sample props for the daily-note screen of docs/demo.html (2026-08).
 * Pass these into `Calendar` / `DailyNav` to see the finished layout without a
 * running server, the same way `components/shell/__fixtures__/sample.ts` works.
 */
import type { CalendarDay } from "../Calendar";

export const sampleYear = 2026;
export const sampleMonth = 8;

/** Days of 2026-08 that have a daily note in the vault. */
const DAYS = [2, 3, 4, 5, 6, 7, 9, 10, 12, 18, 19, 20] as const;

export const sampleCalendarDays: CalendarDay[] = DAYS.map((day) => {
  const dd = day < 10 ? `0${day}` : String(day);
  return { date: `2026-08-${dd}`, path: `00_Daily/2026/08/${dd}.md` };
});

export const sampleSelectedDate = "2026-08-20";
export const sampleToday = "2026-08-23";

/** Neighbours of `sampleSelectedDate` inside `sampleCalendarDays`. */
export const samplePrevDate = "2026-08-19";
export const sampleNextDate: string | undefined = undefined;
