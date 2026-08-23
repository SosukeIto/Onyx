import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Calendar, DailyNav } from "@/components/daily";
import Loader from "@/components/loader";
import { useCloseLeftDrawer } from "@/hooks/use-panel-dismiss";
import { MissingScreen } from "@/lib/list";
import { NoteScreen } from "@/lib/note-screen";
import { useLeftPanelSlot } from "@/lib/panel-slots";
import { monthOf, shiftMonth, toISODate } from "@/lib/paths";
import { calendarOptions, dailyDetailOptions } from "@/lib/queries";

export const Route = createFileRoute("/daily/$date")({
	component: DailyRoute,
	errorComponent: DailyMissing,
	loader: async ({ context, params }) => {
		try {
			const detail = await context.queryClient.ensureQueryData(
				dailyDetailOptions(params.date),
			);
			return { title: detail.title };
		} catch {
			throw notFound();
		}
	},
	head: ({ loaderData }) => ({
		meta: [{ title: loaderData?.title ?? "Onyx" }],
	}),
	notFoundComponent: DailyMissing,
	pendingComponent: Loader,
});

const FALLBACK_MONTH = { month: 1, year: 2000 } as const;

function DailyMissing() {
	return <MissingScreen path={Route.useParams().date} />;
}

/**
 * Month grid in the left panel.
 *
 * The displayed month is local state so the reader can page away from the open
 * note; the route remounts this with `key={date}`, which snaps the grid back
 * whenever a different day is opened.
 */
function DailyCalendarPanel({ date }: { date: string }) {
	const navigate = useNavigate();
	const closeDrawer = useCloseLeftDrawer();

	const today = toISODate(new Date());
	const todayMonth = monthOf(today) ?? FALLBACK_MONTH;
	const [shown, setShown] = useState(() => monthOf(date) ?? todayMonth);

	const month = useQuery(calendarOptions(shown));
	// Only offer "jump to today" when there is a note to jump to.
	const todayCalendar = useQuery(calendarOptions(todayMonth));
	const hasToday =
		todayCalendar.data?.days.some((day) => day.date === today) ?? false;

	const open = (target: string) => {
		closeDrawer();
		void navigate({ params: { date: target }, to: "/daily/$date" });
	};

	return (
		<Calendar
			days={month.data?.days ?? []}
			month={shown.month}
			onNextMonth={() => setShown((value) => shiftMonth(value, 1))}
			onPrevMonth={() => setShown((value) => shiftMonth(value, -1))}
			onSelect={open}
			onToday={
				hasToday
					? () => {
							setShown(todayMonth);
							open(today);
						}
					: undefined
			}
			selected={date}
			today={today}
			year={shown.year}
		/>
	);
}

/**
 * Previous / next day above the note. Three months of calendar are enough to
 * find the neighbours of any date, including across a month boundary.
 */
function DailyNavBar({ date }: { date: string }) {
	const navigate = useNavigate();
	const month = monthOf(date) ?? FALLBACK_MONTH;

	const before = useQuery(calendarOptions(shiftMonth(month, -1)));
	const current = useQuery(calendarOptions(month));
	const after = useQuery(calendarOptions(shiftMonth(month, 1)));

	const dates = useMemo(() => {
		const all = [
			...(before.data?.days ?? []),
			...(current.data?.days ?? []),
			...(after.data?.days ?? []),
		];
		return all.map((day) => day.date).sort((a, b) => a.localeCompare(b));
	}, [after.data, before.data, current.data]);

	return (
		<DailyNav
			className="mb-5"
			next={dates.find((value) => value > date)}
			onGo={(target) => {
				void navigate({ params: { date: target }, to: "/daily/$date" });
			}}
			prev={dates.filter((value) => value < date).at(-1)}
		/>
	);
}

function DailyRoute() {
	const { date } = Route.useParams();
	const note = useQuery(dailyDetailOptions(date));
	const panel = useLeftPanelSlot(<DailyCalendarPanel date={date} key={date} />);

	return (
		<>
			{panel}
			{note.data ? (
				<NoteScreen detail={note.data} header={<DailyNavBar date={date} />} />
			) : (
				<Loader />
			)}
		</>
	);
}
