import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { IconCalendar } from "@/components/icons";
import { NoteList } from "@/components/list";
import Loader from "@/components/loader";
import { ScreenScroll } from "@/lib/list";
import { formatDate, stripMd, toISODate } from "@/lib/paths";
import { calendarOptions, recentOptions } from "@/lib/queries";

const RECENT_LIMIT = 20;

export const Route = createFileRoute("/_app/")({
  component: HomeComponent,
  loader: ({ context }) => context.queryClient.ensureQueryData(recentOptions(RECENT_LIMIT)),
  pendingComponent: Loader,
});

/**
 * Link to today's daily note, shown only when the file exists.
 *
 * Existence comes from `daily.calendar` rather than a `daily.get` that 404s:
 * the query cache reports every failure through a toast, and "there is no note
 * for today yet" is not an error the reader should be told about.
 */
function TodayRow() {
  const navigate = useNavigate();
  const now = new Date();
  const date = toISODate(now);
  const calendar = useQuery(
    calendarOptions({ month: now.getMonth() + 1, year: now.getFullYear() }),
  );

  const day = calendar.data?.days.find((entry) => entry.date === date);
  if (!day) {
    return null;
  }

  return (
    <div className="mb-2 border-line border-b pb-2">
      <NoteList
        items={[{ folder: day.path, path: day.path, title: date }]}
        leading={() => <IconCalendar size={15} strokeWidth={1.6} />}
        onOpen={() => {
          void navigate({ params: { date }, to: "/daily/$date" });
        }}
      />
    </div>
  );
}

function HomeComponent() {
  const navigate = useNavigate();
  const recent = useQuery(recentOptions(RECENT_LIMIT));

  const items = useMemo(
    () =>
      (recent.data ?? []).map((note) => ({
        folder: note.folder,
        modified: formatDate(note.modified),
        path: note.path,
        title: note.title,
      })),
    [recent.data],
  );

  return (
    <ScreenScroll>
      <TodayRow />
      <NoteList
        items={items}
        onOpen={(path) => {
          void navigate({ params: { _splat: stripMd(path) }, to: "/note/$" });
        }}
      />
    </ScreenScroll>
  );
}
