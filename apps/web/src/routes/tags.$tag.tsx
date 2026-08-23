import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { IconHash } from "@/components/icons";
import { NoteList } from "@/components/list";
import Loader from "@/components/loader";
import { EmptyScreen, ScreenScroll } from "@/lib/list";
import { formatDate, stripMd } from "@/lib/paths";
import { tagNotesOptions } from "@/lib/queries";

export const Route = createFileRoute("/tags/$tag")({
	component: TagRoute,
	head: ({ params }) => ({ meta: [{ title: params.tag }] }),
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(tagNotesOptions(params.tag)),
	pendingComponent: Loader,
});

function TagRoute() {
	const { tag } = Route.useParams();
	const navigate = useNavigate();
	const notes = useQuery(tagNotesOptions(tag));

	const items = useMemo(
		() =>
			(notes.data?.items ?? []).map((note) => ({
				folder: note.folder,
				modified: formatDate(note.modified),
				path: note.path,
				title: note.title,
			})),
		[notes.data],
	);

	if (notes.data && items.length === 0) {
		return <EmptyScreen icon={<IconHash size={42} strokeWidth={1.3} />} />;
	}

	return (
		<ScreenScroll>
			<NoteList
				items={items}
				leading={() => <IconHash size={15} strokeWidth={1.6} />}
				onOpen={(path) => {
					void navigate({ params: { _splat: stripMd(path) }, to: "/note/$" });
				}}
			/>
		</ScreenScroll>
	);
}
