import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { IconMinus, IconPlus, IconTarget } from "@/components/icons";
import { IconButton } from "@/components/shell";
import { cx } from "@/lib/cx";

/** Structural copy of `GraphNode` in `packages/vault/src/static/types.ts`. */
export interface GraphNode {
  /** Note path, or `unresolved:<raw target>`. */
  id: string;
  title: string;
  kind: "note" | "unresolved";
  inDegree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphViewProps {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  selectedId?: string;
  /** Fired with `null` when the background is clicked. */
  onSelect?: (id: string | null) => void;
  /** Double click / Enter on an existing note. Never fired for unresolved. */
  onOpen?: (path: string) => void;
  /** Hide `kind: "unresolved"` nodes and the edges touching them. */
  showUnresolved?: boolean;
  /** How many of the most-linked nodes keep a permanent label. */
  labelTop?: number;
  /** Radius multiplier — display only, it never restarts the simulation. */
  nodeScale?: number;
  /** Target edge length in layout units. */
  linkDistance?: number;
  /** Repulsion multiplier. */
  repulse?: number;
  className?: string;
}

/** Layout canvas. The SVG scales to its box through the viewBox. */
const W = 960;
const H = 600;
const MIN_R = 4;
const MAX_R = 14;
const MAX_TICKS = 320;
const LABEL_CHARS = 14;

interface SimNode extends SimulationNodeDatum {
  id: string;
  r: number;
}

interface Placed {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** √inDegree scaled into [MIN_R, MAX_R]; 0 in-links stays at MIN_R. */
function baseRadius(inDegree: number, maxInDegree: number): number {
  if (maxInDegree <= 0) {
    return MIN_R;
  }
  const t = Math.sqrt(Math.max(inDegree, 0)) / Math.sqrt(maxInDegree);
  return clamp(MIN_R + (MAX_R - MIN_R) * t, MIN_R, MAX_R);
}

function ellipsis(text: string): string {
  return text.length > LABEL_CHARS ? `${text.slice(0, LABEL_CHARS)}…` : text;
}

/**
 * Link graph of the vault (`#screen-graph` in docs/demo.html).
 *
 * d3-force computes the layout only; every element is rendered by React and no
 * `d3-selection` call touches the DOM. Under `prefers-reduced-motion` the
 * simulation is ticked to convergence synchronously and painted once.
 */
export function GraphView({
  nodes,
  edges,
  selectedId,
  onSelect,
  onOpen,
  showUnresolved = true,
  labelTop = 12,
  nodeScale = 1,
  linkDistance = 180,
  repulse = 0.8,
  className,
}: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, Placed>>({});
  const [view, setView] = useState({ x: 0, y: 0, w: W, h: H });
  const viewRef = useRef(view);
  viewRef.current = view;

  const visibleNodes = useMemo(
    () => (showUnresolved ? nodes : nodes.filter((node) => node.kind !== "unresolved")),
    [nodes, showUnresolved],
  );

  const byId = useMemo(() => new Map(visibleNodes.map((node) => [node.id, node])), [visibleNodes]);

  const visibleEdges = useMemo(
    () => edges.filter((edge) => byId.has(edge.source) && byId.has(edge.target)),
    [edges, byId],
  );

  const maxInDegree = useMemo(
    () => visibleNodes.reduce((max, node) => Math.max(max, node.inDegree), 0),
    [visibleNodes],
  );

  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of visibleEdges) {
      const a = map.get(edge.source) ?? new Set<string>();
      a.add(edge.target);
      map.set(edge.source, a);
      const b = map.get(edge.target) ?? new Set<string>();
      b.add(edge.source);
      map.set(edge.target, b);
    }
    return map;
  }, [visibleEdges]);

  const labelled = useMemo(() => {
    const top = [...visibleNodes]
      .sort((a, b) => b.inDegree - a.inDegree)
      .slice(0, Math.max(labelTop, 0))
      .map((node) => node.id);
    return new Set(top);
  }, [visibleNodes, labelTop]);

  /** Stable identity of the layout inputs — the simulation restarts on change. */
  const layoutKey = visibleNodes.map((node) => node.id).join("\u0000");
  const edgeKey = visibleEdges.map((edge) => `${edge.source}\u0000${edge.target}`).join("\u0000");

  // biome-ignore lint/correctness/useExhaustiveDependencies: layoutKey / edgeKey are the value identity of nodes / edges
  useEffect(() => {
    const simNodes: SimNode[] = visibleNodes.map((node, index) => {
      const angle = (index / Math.max(visibleNodes.length, 1)) * Math.PI * 2;
      const ring = 40 + (index % 7) * 26;
      return {
        id: node.id,
        r: baseRadius(node.inDegree, maxInDegree),
        x: W / 2 + Math.cos(angle) * ring,
        y: H / 2 + Math.sin(angle) * ring,
      };
    });
    const simLinks: SimulationLinkDatum<SimNode>[] = visibleEdges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const sim = forceSimulation(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
          .id((node) => node.id)
          .distance(linkDistance)
          .strength(0.55),
      )
      .force("charge", forceManyBody().strength(-260 * repulse))
      .force("center", forceCenter(W / 2, H / 2))
      .force(
        "collide",
        forceCollide<SimNode>((node) => node.r + 6),
      )
      .force("x", forceX(W / 2).strength(0.035))
      .force("y", forceY(H / 2).strength(0.035))
      .stop();

    const commit = () => {
      const next: Record<string, Placed> = {};
      for (const node of simNodes) {
        next[node.id] = { x: node.x ?? W / 2, y: node.y ?? H / 2 };
      }
      setPlaced(next);
    };

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      sim.tick(MAX_TICKS);
      commit();
      return () => sim.stop();
    }

    let frame = 0;
    let ticks = 0;
    const step = () => {
      sim.tick(2);
      ticks += 2;
      commit();
      if (ticks < MAX_TICKS && sim.alpha() > 0.02) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      sim.stop();
    };
  }, [layoutKey, edgeKey, linkDistance, repulse, maxInDegree]);

  /* ---------- zoom (wheel, non-passive) ---------- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      setView((current) => {
        const scale = Math.min(rect.width / current.w, rect.height / current.h);
        const offX = (rect.width - current.w * scale) / 2;
        const offY = (rect.height - current.h * scale) / 2;
        const ux = current.x + (event.clientX - rect.left - offX) / scale;
        const uy = current.y + (event.clientY - rect.top - offY) / scale;

        const k = clamp(Math.exp(event.deltaY * 0.0015), 0.5, 2);
        const w = clamp(current.w * k, W / 8, W * 4);
        const h = (w / current.w) * current.h;
        const nextScale = Math.min(rect.width / w, rect.height / h);
        return {
          w,
          h,
          x: ux - (event.clientX - rect.left - offX) / nextScale,
          y: uy - (event.clientY - rect.top - offY) / nextScale,
        };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  /* ---------- touch: the graph owns every gesture while it is on screen ---------- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    // iOS Safari ignores `touch-action` on SVG content, so one-finger pans
    // also scroll the page. Swallow touchmove inside the graph (non-passive)
    // and turn off page-level scrolling/bounce while the graph is mounted.
    const swallow = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length === 2) {
        onPinchMove(event);
      }
    };
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        onPinchStart(event);
      }
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        pinch.current = null;
      }
    };
    host.addEventListener("touchstart", onTouchStart, { passive: true });
    host.addEventListener("touchmove", swallow, { passive: false });
    host.addEventListener("touchend", onTouchEnd);
    host.addEventListener("touchcancel", onTouchEnd);
    const root = document.documentElement;
    const previous = {
      overscroll: root.style.overscrollBehavior,
      overflow: root.style.overflow,
    };
    root.style.overscrollBehavior = "none";
    root.style.overflow = "hidden";
    return () => {
      host.removeEventListener("touchstart", onTouchStart);
      host.removeEventListener("touchmove", swallow);
      host.removeEventListener("touchend", onTouchEnd);
      host.removeEventListener("touchcancel", onTouchEnd);
      root.style.overscrollBehavior = previous.overscroll;
      root.style.overflow = previous.overflow;
    };
  }, []);

  /* ---------- pinch zoom (two fingers) ---------- */
  const pinch = useRef<{
    distance: number;
    midX: number;
    midY: number;
    view: { x: number; y: number; w: number; h: number };
  } | null>(null);

  function touchGeometry(event: TouchEvent) {
    const [a, b] = [event.touches[0], event.touches[1]];
    if (!a || !b) {
      return null;
    }
    return {
      distance: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
      midX: (a.clientX + b.clientX) / 2,
      midY: (a.clientY + b.clientY) / 2,
    };
  }

  function onPinchStart(event: TouchEvent) {
    const geometry = touchGeometry(event);
    if (!geometry) {
      return;
    }
    // A second finger ends any one-finger pan so the two gestures never fight.
    drag.current = null;
    pinch.current = { ...geometry, view: viewRef.current };
  }

  function onPinchMove(event: TouchEvent) {
    const start = pinch.current;
    const svg = svgRef.current;
    const geometry = touchGeometry(event);
    if (!start || !svg || !geometry || start.distance === 0) {
      return;
    }
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const { view: from } = start;
    const scale = Math.min(rect.width / from.w, rect.height / from.h);
    const offX = (rect.width - from.w * scale) / 2;
    const offY = (rect.height - from.h * scale) / 2;
    // Vault-space point under the initial midpoint stays under the current midpoint.
    const ux = from.x + (start.midX - rect.left - offX) / scale;
    const uy = from.y + (start.midY - rect.top - offY) / scale;

    const k = clamp(start.distance / geometry.distance, 0.1, 10);
    const w = clamp(from.w * k, W / 8, W * 4);
    const h = (w / from.w) * from.h;
    const nextScale = Math.min(rect.width / w, rect.height / h);
    const nextOffX = (rect.width - w * nextScale) / 2;
    const nextOffY = (rect.height - h * nextScale) / 2;
    setView({
      w,
      h,
      x: ux - (geometry.midX - rect.left - nextOffX) / nextScale,
      y: uy - (geometry.midY - rect.top - nextOffY) / nextScale,
    });
  }

  /* ---------- pan ---------- */
  const drag = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    view: typeof view;
    moved: boolean;
  } | null>(null);

  function onBackgroundPointerDown(event: ReactPointerEvent<SVGRectElement>) {
    if (event.button !== 0) {
      return;
    }
    drag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      view,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onBackgroundPointerMove(event: ReactPointerEvent<SVGRectElement>) {
    const state = drag.current;
    const svg = svgRef.current;
    if (!state || state.pointerId !== event.pointerId || !svg) {
      return;
    }
    const dx = event.clientX - state.clientX;
    const dy = event.clientY - state.clientY;
    if (!state.moved && Math.abs(dx) + Math.abs(dy) < 3) {
      return;
    }
    state.moved = true;
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / state.view.w, rect.height / state.view.h);
    if (scale === 0) {
      return;
    }
    setView({
      ...state.view,
      x: state.view.x - dx / scale,
      y: state.view.y - dy / scale,
    });
  }

  function onBackgroundPointerUp(event: ReactPointerEvent<SVGRectElement>) {
    const state = drag.current;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (state && !state.moved) {
      onSelect?.(null);
    }
  }

  function zoomBy(k: number) {
    setView((current) => {
      const w = clamp(current.w * k, W / 8, W * 4);
      const h = (w / current.w) * current.h;
      return {
        w,
        h,
        x: current.x + (current.w - w) / 2,
        y: current.y + (current.h - h) / 2,
      };
    });
  }

  const focusSet = useMemo(() => {
    if (!selectedId || !byId.has(selectedId)) {
      return null;
    }
    const set = new Set<string>([selectedId]);
    for (const id of neighbours.get(selectedId) ?? []) {
      set.add(id);
    }
    return set;
  }, [selectedId, byId, neighbours]);

  function open(node: GraphNode) {
    if (node.kind === "note") {
      onOpen?.(node.id);
    }
  }

  function onNodeKeyDown(event: ReactKeyboardEvent<SVGGElement>, node: GraphNode) {
    if (event.key === "Enter") {
      event.preventDefault();
      open(node);
    } else if (event.key === " ") {
      event.preventDefault();
      onSelect?.(node.id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onSelect?.(null);
    }
  }

  return (
    <div
      className={cx(
        "relative min-h-0 min-w-0 flex-1 touch-none overflow-hidden overscroll-contain bg-app",
        className,
      )}
      ref={hostRef}
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, var(--graph-grid) 1px, transparent 0)",
        backgroundSize: "22px 22px",
      }}
    >
      <svg
        aria-label={`vault のリンク構造グラフ ${visibleNodes.length} ノード / ${visibleEdges.length} エッジ`}
        className="block h-full w-full touch-none select-none"
        preserveAspectRatio="xMidYMid meet"
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          fill="transparent"
          height={view.h}
          onPointerCancel={onBackgroundPointerUp}
          onPointerDown={onBackgroundPointerDown}
          onPointerMove={onBackgroundPointerMove}
          onPointerUp={onBackgroundPointerUp}
          width={view.w}
          x={view.x}
          y={view.y}
        />

        <g>
          {visibleEdges.map((edge) => {
            const a = placed[edge.source];
            const b = placed[edge.target];
            if (!(a && b)) {
              return null;
            }
            const dashed =
              byId.get(edge.source)?.kind === "unresolved" ||
              byId.get(edge.target)?.kind === "unresolved";
            const dim =
              focusSet !== null && !(focusSet.has(edge.source) && focusSet.has(edge.target));
            return (
              <line
                className="stroke-line-strong"
                key={`${edge.source}\u0000${edge.target}`}
                opacity={dim ? 0.1 : 0.75}
                strokeDasharray={dashed ? "3 4" : undefined}
                strokeWidth={1.1}
                x1={a.x}
                x2={b.x}
                y1={a.y}
                y2={b.y}
              />
            );
          })}
        </g>

        <g>
          {visibleNodes.map((node) => {
            const at = placed[node.id];
            if (!at) {
              return null;
            }
            const r = Math.max(2, baseRadius(node.inDegree, maxInDegree) * nodeScale);
            const selected = node.id === selectedId;
            const hovered = node.id === hoverId;
            const dim = focusSet !== null && !focusSet.has(node.id);
            const showLabel = selected || hovered || labelled.has(node.id);
            const big = labelled.has(node.id);
            const unresolved = node.kind === "unresolved";
            let circleClass = "fill-brand stroke-app";
            if (unresolved) {
              circleClass = "fill-none stroke-link-unresolved";
            } else if (selected) {
              circleClass = "fill-brand stroke-brand";
            }
            let strokeWidth = 2;
            if (unresolved) {
              strokeWidth = 1.5;
            } else if (selected) {
              strokeWidth = 3;
            }
            let labelClass = "fill-ink-muted";
            if (selected) {
              labelClass = "fill-brand font-bold";
            } else if (big) {
              labelClass = "fill-ink font-medium";
            }
            return (
              // biome-ignore lint/a11y/useSemanticElements: an SVG node cannot be a <button> without losing the coordinate system
              <g
                aria-label={unresolved ? `${node.title} 未作成` : node.title}
                className="cursor-pointer outline-none"
                key={node.id}
                onBlur={() => setHoverId(null)}
                onClick={() => onSelect?.(node.id)}
                onDoubleClick={() => open(node)}
                onFocus={() => setHoverId(node.id)}
                onKeyDown={(event) => onNodeKeyDown(event, node)}
                onPointerEnter={() => setHoverId(node.id)}
                onPointerLeave={() =>
                  setHoverId((current) => (current === node.id ? null : current))
                }
                opacity={dim ? 0.16 : 1}
                role="button"
                tabIndex={0}
              >
                <circle
                  className={circleClass}
                  cx={at.x}
                  cy={at.y}
                  r={r}
                  strokeDasharray={unresolved ? "3 3" : undefined}
                  strokeWidth={strokeWidth}
                />
                {showLabel ? (
                  <text
                    className={cx("pointer-events-none", labelClass)}
                    fontSize={big ? 12.5 : 11}
                    textAnchor="middle"
                    x={at.x}
                    y={at.y + r + 15}
                  >
                    {ellipsis(node.title)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-3.5 left-3.5 flex items-center gap-4 rounded-lg border border-line bg-panel/90 px-3 py-2 text-ink-muted text-micro backdrop-blur-sm">
        <span className="flex items-center gap-1.5" title="既存ノート">
          <span aria-hidden="true" className="size-2.5 flex-none rounded-full bg-brand" />
          <span className="sr-only">既存ノート</span>
        </span>
        <span className="flex items-center gap-1.5" title="未作成リンク">
          <span
            aria-hidden="true"
            className="size-2.5 flex-none rounded-full border border-link-unresolved border-dashed"
          />
          <span className="sr-only">未作成リンク</span>
        </span>
        <span className="flex items-center gap-1.5" title="円の大きさ = 被リンク数">
          <span aria-hidden="true" className="size-1.5 flex-none rounded-full bg-brand" />
          <span aria-hidden="true" className="size-3 flex-none rounded-full bg-brand" />
          <span className="sr-only">円の大きさ = 被リンク数</span>
        </span>
      </div>

      <div className="absolute right-3.5 bottom-3.5 flex flex-col rounded-lg border border-line bg-panel p-1">
        <IconButton label="拡大" onClick={() => zoomBy(0.8)} title="拡大">
          <IconPlus size={18} />
        </IconButton>
        <IconButton label="縮小" onClick={() => zoomBy(1.25)} title="縮小">
          <IconMinus size={18} />
        </IconButton>
        <IconButton
          label="全体を表示"
          onClick={() => setView({ x: 0, y: 0, w: W, h: H })}
          title="全体を表示"
        >
          <IconTarget size={18} />
        </IconButton>
      </div>
    </div>
  );
}
