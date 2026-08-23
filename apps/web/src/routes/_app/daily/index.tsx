import { createFileRoute, redirect } from "@tanstack/react-router";

import Loader from "@/components/loader";
import { shiftMonth, toISODate } from "@/lib/paths";
import { catalogOptions, daysInMonth } from "@/lib/queries";

/**
 * `/daily` has no screen of its own: it lands on today's note, or — when the
 * vault has no note for today — on the newest daily note nearby. The calendar
 * UI itself is Phase 3.
 */
export const Route = createFileRoute("/_app/daily/")({
  loader: async ({ context }) => {
    const now = new Date();
    const date = toISODate(now);
    const month = { month: now.getMonth() + 1, year: now.getFullYear() };

    const catalog = await context.queryClient.ensureQueryData(catalogOptions());
    const current = daysInMonth(catalog, month);
    if (current.some((day) => day.date === date)) {
      throw redirect({ params: { date }, to: "/daily/$date" });
    }

    const latest = current.at(-1);
    if (latest) {
      throw redirect({ params: { date: latest.date }, to: "/daily/$date" });
    }

    const previous = daysInMonth(catalog, shiftMonth(month, -1));
    throw redirect({
      params: { date: previous.at(-1)?.date ?? date },
      to: "/daily/$date",
    });
  },
  pendingComponent: Loader,
});
