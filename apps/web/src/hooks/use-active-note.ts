import type { NotePayload } from "@/server/vault";
import { useQuery } from "@tanstack/react-query";
import { useMatch } from "@tanstack/react-router";

import { withMd } from "@/lib/paths";
import { dailyDetailOptions, noteDetailOptions } from "@/lib/queries";

export interface ActiveNote {
  /** Vault path with the `.md` suffix, or `undefined` off a note route. */
  path?: string;
  detail?: NotePayload;
}

/**
 * The note the shell is currently showing, read straight from the router.
 *
 * `__root` needs the same payload the route component renders (outline,
 * backlinks, file facts). Instead of pushing it up through a context, both
 * sides build the query the same way — TanStack Query then serves one cache
 * entry to both observers, so nothing is fetched twice.
 */
export function useActiveNote(): ActiveNote {
  const splat = useMatch({
    from: "/_app/note/$",
    select: (match) => match.params._splat,
    shouldThrow: false,
  });
  const date = useMatch({
    from: "/_app/daily/$date",
    select: (match) => match.params.date,
    shouldThrow: false,
  });

  const note = useQuery(noteDetailOptions(splat));
  const daily = useQuery(dailyDetailOptions(date));

  let detail: NotePayload | undefined;
  if (splat !== undefined) {
    detail = note.data ?? undefined;
  } else if (date !== undefined) {
    detail = daily.data ?? undefined;
  }

  if (detail) {
    return { detail, path: detail.path };
  }
  return { path: splat === undefined ? undefined : withMd(splat) };
}
