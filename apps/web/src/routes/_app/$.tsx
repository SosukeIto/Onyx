import { createFileRoute } from "@tanstack/react-router";

import { IconUnresolved } from "@/components/icons";
import { EmptyScreen } from "@/lib/list";

/**
 * Catch-all 404.
 *
 * It sits *inside* the `_app` layout on purpose: an unknown URL still draws
 * the shell, so the reader can navigate away from it — and it still goes
 * through the session guard, so a logged-out visitor lands on /login rather
 * than on a bare 404. Every real screen has a more specific route, so this
 * only ever matches what nothing else claimed.
 */
export const Route = createFileRoute("/_app/$")({
  component: NotFoundRoute,
});

function NotFoundRoute() {
  return <EmptyScreen icon={<IconUnresolved size={42} strokeWidth={1.3} />} />;
}
