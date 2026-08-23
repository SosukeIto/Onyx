import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { IconHash } from "@/components/icons";
import Loader from "@/components/loader";
import { EmptyScreen, NoteRow, ScreenScroll } from "@/lib/list";
import { formatDate } from "@/lib/paths";
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
	const notes = useQuery(tagNotesOptions(tag));

	if (notes.data && notes.data.items.length === 0) {
		return <EmptyScreen icon={<IconHash size={42} strokeWidth={1.3} />} />;
	}

	return (
		<ScreenScroll>
			{notes.data?.items.map((note) => (
				<NoteRow
					icon={<IconHash size={16} strokeWidth={1.6} />}
					key={note.path}
					meta={formatDate(note.modified)}
					path={note.path}
					title={note.title}
				/>
			))}
		</ScreenScroll>
	);
}
