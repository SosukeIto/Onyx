import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { IconCalendar } from "@/components/icons";
import Loader from "@/components/loader";
import { NoteRow, ROW_CLASS, RowContent, ScreenScroll } from "@/lib/list";
import { formatDate, toISODate } from "@/lib/paths";
import { calendarOptions, recentOptions } from "@/lib/queries";

const RECENT_LIMIT = 20;

export const Route = createFileRoute("/")({
	component: HomeComponent,
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(recentOptions(RECENT_LIMIT)),
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
			<Link
				className={ROW_CLASS}
				params={{ date }}
				title={day.path}
				to="/daily/$date"
			>
				<RowContent
					icon={<IconCalendar size={16} strokeWidth={1.6} />}
					sub={day.path}
					title={date}
				/>
			</Link>
		</div>
	);
}

function HomeComponent() {
	const recent = useQuery(recentOptions(RECENT_LIMIT));

	return (
		<ScreenScroll>
			<TodayRow />
			{recent.data?.map((note) => (
				<NoteRow
					key={note.path}
					meta={formatDate(note.modified)}
					path={note.path}
					title={note.title}
				/>
			))}
		</ScreenScroll>
	);
}
