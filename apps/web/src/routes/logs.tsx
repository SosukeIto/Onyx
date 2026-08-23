import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";

import { IconFolder, IconNote } from "@/components/icons";
import { NoteList } from "@/components/list";
import Loader from "@/components/loader";
import { ScreenScroll } from "@/lib/list";
import { useLeftPanelSlot } from "@/lib/panel-slots";
import { stripMd } from "@/lib/paths";
import { logsOptions } from "@/lib/queries";

const searchSchema = z.object({
	project: z.string().optional(),
});

/** Prefix that turns a project name into a `NoteList` key / `onOpen` payload. */
const PROJECT_PREFIX = "project:";

/**
 * Claude conversation logs (`02_ClaudeLogs`), newest first. The left panel
 * lists projects as a facet; picking one narrows the list via `?project=`.
 */
export const Route = createFileRoute("/logs")({
	component: LogsRoute,
	loaderDeps: ({ search }) => ({ project: search.project }),
	loader: ({ context, deps }) =>
		context.queryClient.ensureQueryData(logsOptions(deps.project)),
	pendingComponent: Loader,
	validateSearch: (input: Record<string, unknown>) => searchSchema.parse(input),
});

function LogsRoute() {
	const navigate = useNavigate();
	const { project } = Route.useSearch();
	const logs = useQuery(logsOptions(project));

	const items = useMemo(
		() =>
			(logs.data?.items ?? []).map((log) => ({
				folder: log.project ?? undefined,
				modified: log.date ?? undefined,
				path: log.path,
				title: log.title,
			})),
		[logs.data],
	);

	const projects = useMemo(
		() =>
			(logs.data?.projects ?? []).map((entry) => ({
				count: entry.count,
				path: `${PROJECT_PREFIX}${entry.project}`,
				title: entry.project,
			})),
		[logs.data],
	);

	const facet = useLeftPanelSlot(
		projects.length > 0 ? (
			<NoteList
				activePath={project ? `${PROJECT_PREFIX}${project}` : undefined}
				items={projects}
				leading={() => <IconFolder size={15} strokeWidth={1.6} />}
				onOpen={(path) => {
					const next = path.slice(PROJECT_PREFIX.length);
					void navigate({
						replace: true,
						search: { project: next === project ? undefined : next },
						to: "/logs",
					});
				}}
			/>
		) : null,
	);

	return (
		<>
			{facet}
			<ScreenScroll>
				<NoteList
					items={items}
					leading={() => <IconNote size={15} strokeWidth={1.6} />}
					onOpen={(path) => {
						void navigate({ params: { _splat: stripMd(path) }, to: "/note/$" });
					}}
				/>
			</ScreenScroll>
		</>
	);
}
