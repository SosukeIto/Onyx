import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { IconUnresolved } from "@/components/icons";
import { NoteList } from "@/components/list";
import Loader from "@/components/loader";
import { ScreenScroll } from "@/lib/list";
import { stripMd } from "@/lib/paths";
import { unresolvedOptions } from "@/lib/queries";

/** Same id shape the graph uses for a target with no file behind it. */
const UNRESOLVED_PREFIX = "unresolved:";

export const Route = createFileRoute("/_app/unresolved")({
  component: UnresolvedRoute,
  loader: ({ context }) => context.queryClient.ensureQueryData(unresolvedOptions()),
  pendingComponent: Loader,
});

/**
 * Link targets with no file behind them. There is nothing to open at the
 * target itself, so a row leads to the first note that points at it.
 */
function UnresolvedRoute() {
  const navigate = useNavigate();
  const targets = useQuery(unresolvedOptions());

  const { items, sources } = useMemo(() => {
    const entries = targets.data ?? [];
    return {
      items: entries.map((entry) => ({
        count: entry.count,
        path: `${UNRESOLVED_PREFIX}${entry.target}`,
        title: entry.target,
      })),
      sources: new Map(
        entries.map((entry) => [`${UNRESOLVED_PREFIX}${entry.target}`, entry.from[0]]),
      ),
    };
  }, [targets.data]);

  return (
    <ScreenScroll>
      <NoteList
        items={items}
        leading={() => (
          <IconUnresolved className="text-link-unresolved" size={15} strokeWidth={1.6} />
        )}
        onOpen={(path) => {
          const from = sources.get(path);
          if (from) {
            void navigate({ params: { _splat: stripMd(from) }, to: "/note/$" });
          }
        }}
      />
    </ScreenScroll>
  );
}
