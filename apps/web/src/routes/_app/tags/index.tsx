import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { IconHash } from "@/components/icons";
import { NoteList } from "@/components/list";
import Loader from "@/components/loader";
import { ScreenScroll } from "@/lib/list";
import { tagsOptions } from "@/lib/queries";

/** Prefix that turns a tag into the `NoteList` key / `onOpen` payload. */
const TAG_PREFIX = "/tags/";

/**
 * Every tag with its note count. There is no rail entry for this screen — it is
 * reached by URL and from the tag chips inside a note.
 */
export const Route = createFileRoute("/_app/tags/")({
  component: TagsRoute,
  loader: ({ context }) => context.queryClient.ensureQueryData(tagsOptions()),
  pendingComponent: Loader,
});

function TagsRoute() {
  const navigate = useNavigate();
  const tags = useQuery(tagsOptions());

  const items = useMemo(
    () =>
      (tags.data ?? []).map((entry) => ({
        count: entry.count,
        path: `${TAG_PREFIX}${entry.tag}`,
        title: `#${entry.tag}`,
      })),
    [tags.data],
  );

  return (
    <ScreenScroll>
      <NoteList
        items={items}
        leading={() => <IconHash size={15} strokeWidth={1.6} />}
        onOpen={(path) => {
          void navigate({
            params: { tag: path.slice(TAG_PREFIX.length) },
            to: "/tags/$tag",
          });
        }}
      />
    </ScreenScroll>
  );
}
