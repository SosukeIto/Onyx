import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { SearchFacets, SearchInput, SearchResults } from "@/components/search";
import { useCloseLeftDrawer } from "@/hooks/use-panel-dismiss";
import { useLeftPanelSlot } from "@/lib/panel-slots";
import { stripMd } from "@/lib/paths";
import { searchOptions, tagsOptions, treeOptions } from "@/lib/queries";

const DEBOUNCE_MS = 250;

const searchSchema = z.object({
	folder: z.string().optional(),
	q: z.string().optional(),
	tag: z.string().optional(),
});

export const Route = createFileRoute("/search")({
	component: SearchRoute,
	validateSearch: (input: Record<string, unknown>) => searchSchema.parse(input),
});

/**
 * Facet column.
 *
 * Folders are the top level of the vault tree — deeper folders would make the
 * column longer than the results. Months are left out: the API has no date
 * facet, and a client-side one would only ever describe the current page.
 */
function SearchFacetsPanel({ folder, tag }: { folder?: string; tag?: string }) {
	const navigate = useNavigate();
	const closeDrawer = useCloseLeftDrawer();
	const tree = useQuery(treeOptions());
	const tags = useQuery(tagsOptions());

	const folders = useMemo(
		() =>
			(tree.data?.children ?? [])
				.filter((child) => child.kind === "folder")
				.map((child) => ({ count: child.noteCount, path: child.path })),
		[tree.data],
	);

	return (
		<SearchFacets
			folders={folders}
			onOpenTags={() => {
				closeDrawer();
				void navigate({ to: "/tags" });
			}}
			onChange={(selection) => {
				closeDrawer();
				void navigate({
					search: (previous) => ({
						...previous,
						folder: selection.folder,
						tag: selection.tag,
					}),
					to: "/search",
				});
			}}
			selectedFolder={folder}
			selectedTag={tag}
			tags={tags.data}
		/>
	);
}

function SearchRoute() {
	const { folder, q, tag } = Route.useSearch();
	const navigate = useNavigate();

	const [value, setValue] = useState(q ?? "");
	const [debounced, setDebounced] = useState(q ?? "");

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [value]);

	// The URL mirrors the field so a result page can be shared, but always with
	// `replace` — typing must not fill the history with one entry per keystroke.
	// The facets live in the same search object, so they are carried over.
	useEffect(() => {
		void navigate({
			replace: true,
			search: (previous) => ({
				...previous,
				q: debounced === "" ? undefined : debounced,
			}),
			to: "/search",
		});
	}, [debounced, navigate]);

	const query = debounced.trim();
	const results = useQuery(searchOptions(query, { folder, tag }));
	const panel = useLeftPanelSlot(
		<SearchFacetsPanel folder={folder} tag={tag} />,
	);

	return (
		<>
			{panel}
			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				{/* No option row is wired up: `search.query` has no case / regex /
				    title-only mode, so the toggles stay read-only. The `px-3`
				    lines the field up with the `px-5` of the result list. */}
				<div className="min-w-0 max-w-[880px] flex-none px-3">
					<SearchInput autoFocus onChange={setValue} value={value} />
				</div>
				<div className="onyx-scroll min-h-0 min-w-0 flex-1">
					<SearchResults
						hits={results.data ?? []}
						onOpen={(path) => {
							void navigate({
								params: { _splat: stripMd(path) },
								to: "/note/$",
							});
						}}
						query={query}
					/>
				</div>
			</div>
		</>
	);
}
