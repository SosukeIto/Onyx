import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { IconUnresolved } from "@/components/icons";
import Loader from "@/components/loader";
import { NoteRow, ScreenScroll, StaticRow } from "@/lib/list";
import { unresolvedOptions } from "@/lib/queries";

export const Route = createFileRoute("/unresolved")({
	component: UnresolvedRoute,
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(unresolvedOptions()),
	pendingComponent: Loader,
});

/** Link targets with no file behind them, and the notes that point at them. */
function UnresolvedRoute() {
	const targets = useQuery(unresolvedOptions());

	return (
		<ScreenScroll>
			{targets.data?.map((entry) => (
				<div
					className="border-line border-b pb-1 last:border-b-0"
					key={entry.target}
				>
					<StaticRow
						icon={
							<IconUnresolved
								className="text-link-unresolved"
								size={16}
								strokeWidth={1.6}
							/>
						}
						meta={entry.count}
						title={entry.target}
					/>
					<div className="pl-6">
						{entry.from.map((path) => (
							<NoteRow key={path} path={path} />
						))}
					</div>
				</div>
			))}
		</ScreenScroll>
	);
}
