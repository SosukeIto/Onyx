import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import Loader from "@/components/loader";
import { MissingScreen } from "@/lib/list";
import { NoteScreen } from "@/lib/note-screen";
import { withMd } from "@/lib/paths";
import { noteDetailOptions } from "@/lib/queries";

export const Route = createFileRoute("/_app/note/$")({
  component: NoteRoute,
  errorComponent: NoteMissing,
  loader: async ({ context, params }) => {
    const path = params._splat ?? "";
    if (path === "") {
      throw notFound();
    }
    const detail = await context.queryClient.ensureQueryData(noteDetailOptions(path));
    if (!detail) {
      throw notFound();
    }
    return { title: detail.title };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title ?? "Onyx" }],
  }),
  notFoundComponent: NoteMissing,
  pendingComponent: Loader,
});

function NoteMissing() {
  const { _splat } = Route.useParams();
  return <MissingScreen path={withMd(_splat ?? "")} />;
}

function NoteRoute() {
  const { _splat } = Route.useParams();
  const note = useQuery(noteDetailOptions(_splat));

  if (!note.data) {
    return <Loader />;
  }
  return <NoteScreen detail={note.data} />;
}
