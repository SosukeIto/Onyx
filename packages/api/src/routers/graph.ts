import type { VaultIndex } from "@Onyx/vault";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../index";
import { graphDataSchema } from "../schemas";
import { findNotePath } from "./shared";

const UNRESOLVED_PREFIX = "unresolved:";
const DEFAULT_DEPTH = 1;

interface GraphNode {
	id: string;
	title: string;
	kind: "note" | "unresolved";
	inDegree: number;
}

interface GraphEdge {
	source: string;
	target: string;
}

/** Whole-vault graph: every note plus one node per unresolved link target. */
function buildGraph(index: VaultIndex): {
	nodes: Map<string, GraphNode>;
	edges: GraphEdge[];
} {
	const nodes = new Map<string, GraphNode>();
	for (const [notePath, note] of index.notes) {
		nodes.set(notePath, {
			id: notePath,
			title: note.title,
			kind: "note",
			inDegree: 0,
		});
	}

	const edges: GraphEdge[] = [];
	const seen = new Set<string>();

	for (const link of index.links) {
		if (!index.notes.has(link.from)) continue;

		let target: string;
		if (link.to === null) {
			target = `${UNRESOLVED_PREFIX}${link.target}`;
			if (!nodes.has(target)) {
				nodes.set(target, {
					id: target,
					title: link.target,
					kind: "unresolved",
					inDegree: 0,
				});
			}
		} else if (index.notes.has(link.to)) {
			target = link.to;
		} else {
			// Attachment embeds are not part of the note graph.
			continue;
		}

		if (target === link.from) continue;

		const key = `${link.from} -> ${target}`;
		if (seen.has(key)) continue;
		seen.add(key);

		edges.push({ source: link.from, target });
	}

	for (const edge of edges) {
		const node = nodes.get(edge.target);
		if (node) node.inDegree += 1;
	}

	return { nodes, edges };
}

/** Node ids within `depth` undirected hops of `center` (inclusive). */
function neighbourhood(
	edges: GraphEdge[],
	center: string,
	depth: number,
): Set<string> {
	const adjacency = new Map<string, string[]>();
	const connect = (from: string, to: string) => {
		const existing = adjacency.get(from);
		if (existing) existing.push(to);
		else adjacency.set(from, [to]);
	};

	for (const edge of edges) {
		connect(edge.source, edge.target);
		connect(edge.target, edge.source);
	}

	const kept = new Set<string>([center]);
	let frontier = [center];

	for (let step = 0; step < depth; step += 1) {
		const next: string[] = [];
		for (const id of frontier) {
			for (const neighbour of adjacency.get(id) ?? []) {
				if (kept.has(neighbour)) continue;
				kept.add(neighbour);
				next.push(neighbour);
			}
		}
		if (next.length === 0) break;
		frontier = next;
	}

	return kept;
}

export const graphRouter = {
	/**
	 * Link graph. Without `center` the whole vault is returned; with one, only
	 * the nodes within `depth` hops. `inDegree` is always the global value.
	 */
	data: publicProcedure
		.input(
			z
				.object({
					center: z.string().optional(),
					depth: z.number().int().min(0).max(5).optional(),
				})
				.optional(),
		)
		.output(graphDataSchema)
		.handler(({ input, context }) => {
			const index = context.vault.getIndex();
			const { nodes, edges } = buildGraph(index);

			const center = input?.center;
			if (center === undefined || center === "") {
				return { nodes: [...nodes.values()], edges };
			}

			const centerId = center.startsWith(UNRESOLVED_PREFIX)
				? center
				: (findNotePath(index, center) ?? center);

			if (!nodes.has(centerId)) {
				throw new ORPCError("NOT_FOUND", {
					message: `Unknown graph node: ${center}`,
				});
			}

			const kept = neighbourhood(
				edges,
				centerId,
				input?.depth ?? DEFAULT_DEPTH,
			);

			return {
				nodes: [...nodes.values()].filter((node) => kept.has(node.id)),
				edges: edges.filter(
					(edge) => kept.has(edge.source) && kept.has(edge.target),
				),
			};
		}),
};
