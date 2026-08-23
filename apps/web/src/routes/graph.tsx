import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";

import {
	DEFAULT_GRAPH_FILTERS,
	DEFAULT_GRAPH_PARAMS,
	GraphControls,
	type GraphEdge,
	type GraphNode,
	GraphView,
} from "@/components/graph";
import { IconGraph, IconUnresolved } from "@/components/icons";
import { NoteList, type NoteListItem } from "@/components/list";
import Loader from "@/components/loader";
import { PanelSection } from "@/components/shell";
import { useCloseRightOverlay } from "@/hooks/use-panel-dismiss";
import { EmptyScreen } from "@/lib/list";
import { useLeftPanelSlot, useRightPanelSlot } from "@/lib/panel-slots";
import { folderOf, stripMd } from "@/lib/paths";
import { graphOptions } from "@/lib/queries";

/** Node ids of link targets that have no file behind them. */
const UNRESOLVED_PREFIX = "unresolved:";

const graphSchema = z.object({ center: z.string().optional() });

export const Route = createFileRoute("/graph")({
	component: GraphRoute,
	errorComponent: GraphMissing,
	loaderDeps: ({ search }) => ({ center: search.center }),
	loader: ({ context, deps }) =>
		context.queryClient.ensureQueryData(graphOptions(deps.center)),
	pendingComponent: Loader,
	validateSearch: (input: Record<string, unknown>) => graphSchema.parse(input),
});

/** An unknown `?center=` must not take the whole shell down with it. */
function GraphMissing() {
	return <EmptyScreen icon={<IconGraph size={42} strokeWidth={1.3} />} />;
}

interface GraphSlice {
	nodes: readonly GraphNode[];
	edges: readonly GraphEdge[];
}

/** Applies the two filters that are decidable from the graph payload alone. */
function filterGraph(
	data: GraphSlice,
	filters: { orphans: boolean; unresolved: boolean },
): GraphSlice {
	const nodes = filters.unresolved
		? data.nodes
		: data.nodes.filter((node) => node.kind !== "unresolved");

	const ids = new Set(nodes.map((node) => node.id));
	const edges = data.edges.filter(
		(edge) => ids.has(edge.source) && ids.has(edge.target),
	);

	if (filters.orphans) {
		return { edges, nodes };
	}

	// "Orphan" is relative to what is left: a note whose only links pointed at
	// hidden unresolved targets is isolated once those are gone.
	const linked = new Set<string>();
	for (const edge of edges) {
		linked.add(edge.source);
		linked.add(edge.target);
	}
	return { edges, nodes: nodes.filter((node) => linked.has(node.id)) };
}

function toItem(node: GraphNode): NoteListItem {
	const unresolved = node.kind === "unresolved";
	return {
		count: node.inDegree,
		folder: unresolved ? undefined : folderOf(node.id),
		path: node.id,
		title: node.title,
	};
}

function GraphRoute() {
	const { center } = Route.useSearch();
	const navigate = useNavigate();
	const closeOverlay = useCloseRightOverlay();
	const graph = useQuery(graphOptions(center));

	const [params, setParams] = useState(DEFAULT_GRAPH_PARAMS);
	const [filters, setFilters] = useState(DEFAULT_GRAPH_FILTERS);
	const [selected, setSelected] = useState<string | null>(null);

	const view = useMemo(
		() => filterGraph(graph.data ?? { edges: [], nodes: [] }, filters),
		[graph.data, filters],
	);

	/** The selected node followed by everything one hop away from it. */
	const selection = useMemo(() => {
		const node = view.nodes.find((entry) => entry.id === selected);
		if (!node) {
			return null;
		}
		const around = new Set<string>();
		for (const edge of view.edges) {
			if (edge.source === node.id) {
				around.add(edge.target);
			} else if (edge.target === node.id) {
				around.add(edge.source);
			}
		}
		return {
			items: [
				toItem(node),
				...view.nodes.filter((entry) => around.has(entry.id)).map(toItem),
			],
			node,
			total: around.size,
		};
	}, [selected, view]);

	const open = (id: string) => {
		closeOverlay();
		if (id.startsWith(UNRESOLVED_PREFIX)) {
			void navigate({ to: "/unresolved" });
			return;
		}
		void navigate({ params: { _splat: stripMd(id) }, to: "/note/$" });
	};

	const left = useLeftPanelSlot(
		<GraphControls
			filters={filters}
			onFiltersChange={setFilters}
			onParamsChange={setParams}
			params={params}
		/>,
	);

	const right = useRightPanelSlot(
		selection ? (
			<PanelSection
				count={selection.total}
				icon={<IconGraph size={16} strokeWidth={1.6} />}
				label="選択中のノード"
			>
				<NoteList
					activePath={selection.node.id}
					items={selection.items}
					leading={(item) =>
						item.path.startsWith(UNRESOLVED_PREFIX) ? (
							<IconUnresolved
								className="text-link-unresolved"
								size={15}
								strokeWidth={1.6}
							/>
						) : undefined
					}
					onOpen={open}
				/>
			</PanelSection>
		) : null,
	);

	return (
		<>
			{left}
			{right}
			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				<GraphView
					edges={view.edges}
					linkDistance={params.linkDistance}
					nodeScale={params.nodeSize}
					nodes={view.nodes}
					onOpen={open}
					onSelect={setSelected}
					repulse={params.repulse}
					selectedId={selected ?? undefined}
					showUnresolved={filters.unresolved}
				/>
			</div>
		</>
	);
}
