import { createFileRoute } from "@tanstack/react-router";

import { IconGraph } from "@/components/icons";
import { EmptyScreen } from "@/lib/list";

/** Placeholder. The force-directed graph itself is Phase 3 (designer). */
export const Route = createFileRoute("/graph")({
	component: () => (
		<EmptyScreen icon={<IconGraph size={64} strokeWidth={1.1} />} />
	),
});
