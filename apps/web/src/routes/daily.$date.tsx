import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { IconArrowLeft, IconArrowRight } from "@/components/icons";
import Loader from "@/components/loader";
import { IconButton } from "@/components/shell";
import { MissingScreen } from "@/lib/list";
import { NoteScreen } from "@/lib/note-screen";
import { monthOf, shiftMonth } from "@/lib/paths";
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

function DailyMissing() {
	return <MissingScreen path={Route.useParams().date} />;
}

/**
 * Previous / next day. Three months of calendar are enough to find the
 * neighbours of any date, including across a month boundary.
 */
function DailyNav({ date }: { date: string }) {
	const navigate = useNavigate();
	const month = monthOf(date) ?? { month: 1, year: 2000 };

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

	const previous = dates.filter((value) => value < date).at(-1);
	const next = dates.find((value) => value > date);

	const go = (target: string | undefined) => {
		if (target) {
			void navigate({ params: { date: target }, to: "/daily/$date" });
		}
	};

	return (
		<div className="mb-5 flex items-center gap-1">
			<IconButton
				disabled={previous === undefined}
				label="前のデイリーノート"
				onClick={() => go(previous)}
				title={previous}
			>
				<IconArrowLeft size={20} />
			</IconButton>
			<IconButton
				disabled={next === undefined}
				label="次のデイリーノート"
				onClick={() => go(next)}
				title={next}
			>
				<IconArrowRight size={20} />
			</IconButton>
		</div>
	);
}

function DailyRoute() {
	const { date } = Route.useParams();
	const note = useQuery(dailyDetailOptions(date));

	if (!note.data) {
		return <Loader />;
	}
	return <NoteScreen detail={note.data} header={<DailyNav date={date} />} />;
}
