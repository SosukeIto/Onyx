import { type ReactNode, useId } from "react";

import {
	IconClip,
	IconDistance,
	IconFilter,
	IconHash,
	IconNodeSize,
	IconOrphan,
	IconRepulse,
	IconSliders,
	IconUnresolved,
} from "@/components/icons";
import { PanelSection } from "@/components/shell";
import { cx } from "@/lib/cx";

/** Force-layout knobs. Units are the ones `GraphView` consumes directly. */
export interface GraphParams {
	/** Node radius multiplier. */
	nodeSize: number;
	/** Target edge length in layout units. */
	linkDistance: number;
	/** Repulsion multiplier. */
	repulse: number;
}

export interface GraphFilters {
	tags: boolean;
	attachments: boolean;
	unresolved: boolean;
	orphans: boolean;
}

export const DEFAULT_GRAPH_PARAMS: GraphParams = {
	nodeSize: 1,
	linkDistance: 180,
	repulse: 0.8,
};

export const DEFAULT_GRAPH_FILTERS: GraphFilters = {
	tags: true,
	attachments: false,
	unresolved: true,
	orphans: false,
};

export interface GraphControlsProps {
	params?: GraphParams;
	onParamsChange?: (params: GraphParams) => void;
	filters?: GraphFilters;
	onFiltersChange?: (filters: GraphFilters) => void;
	className?: string;
}

interface SliderProps {
	icon: ReactNode;
	label: string;
	min: number;
	max: number;
	step: number;
	value: number;
	/** Digits shown next to the glyph. */
	digits: number;
	onChange: (value: number) => void;
}

function Slider({
	icon,
	label,
	min,
	max,
	step,
	value,
	digits,
	onChange,
}: SliderProps) {
	const id = useId();
	return (
		<div className="min-w-0 p-2" title={label}>
			<label
				className="mb-[5px] flex min-w-0 items-center gap-2 text-ink-muted text-micro tabular-nums"
				htmlFor={id}
			>
				{icon}
				<span className="sr-only">{label}</span>
				<span className="ml-auto">{value.toFixed(digits)}</span>
			</label>
			<input
				aria-label={label}
				className="h-4 w-full min-w-0 [accent-color:var(--accent)]"
				id={id}
				max={max}
				min={min}
				onChange={(event) => onChange(Number(event.target.value))}
				step={step}
				type="range"
				value={value}
			/>
		</div>
	);
}

interface ToggleProps {
	icon: ReactNode;
	label: string;
	on: boolean;
	onToggle: () => void;
}

function Toggle({ icon, label, on, onToggle }: ToggleProps) {
	return (
		<button
			aria-label={label}
			aria-pressed={on}
			className={cx(
				"flex w-full min-w-0 items-center gap-2.5 rounded-md px-2 py-[7px] transition-colors hover:bg-hover",
				on ? "text-brand" : "text-ink-muted",
			)}
			onClick={onToggle}
			title={label}
			type="button"
		>
			{icon}
			<span
				aria-hidden="true"
				className={cx(
					"relative ml-auto h-4 w-7 flex-none rounded-full transition-colors",
					on ? "bg-brand" : "bg-line-strong",
				)}
			>
				<span
					className={cx(
						"absolute top-0.5 left-0.5 size-3 rounded-full shadow-raised transition-transform",
						on ? "translate-x-3 bg-brand-contrast" : "bg-elev",
					)}
				/>
			</span>
		</button>
	);
}

/**
 * Left column of the graph screen (`.slider` / `.toggle` in docs/demo.html):
 * three force sliders with a numeric read-out, and the four display toggles.
 * Every label is a glyph plus `title` / `aria-label` — no visible wording.
 */
export function GraphControls({
	params = DEFAULT_GRAPH_PARAMS,
	onParamsChange,
	filters = DEFAULT_GRAPH_FILTERS,
	onFiltersChange,
	className,
}: GraphControlsProps) {
	function setParam(key: keyof GraphParams, value: number) {
		onParamsChange?.({ ...params, [key]: value });
	}

	function toggle(key: keyof GraphFilters) {
		onFiltersChange?.({ ...filters, [key]: !filters[key] });
	}

	return (
		<div className={cx("min-w-0", className)}>
			<PanelSection
				icon={<IconFilter size={16} strokeWidth={1.6} />}
				label="フィルタ"
			>
				<Toggle
					icon={<IconHash className="flex-none" size={16} strokeWidth={1.6} />}
					label="タグを表示"
					on={filters.tags}
					onToggle={() => toggle("tags")}
				/>
				<Toggle
					icon={<IconClip className="flex-none" size={16} strokeWidth={1.6} />}
					label="添付ファイルを表示"
					on={filters.attachments}
					onToggle={() => toggle("attachments")}
				/>
				<Toggle
					icon={
						<IconUnresolved className="flex-none" size={16} strokeWidth={1.6} />
					}
					label="未作成ノートを表示"
					on={filters.unresolved}
					onToggle={() => toggle("unresolved")}
				/>
				<Toggle
					icon={
						<IconOrphan className="flex-none" size={16} strokeWidth={1.6} />
					}
					label="孤立ノートを表示"
					on={filters.orphans}
					onToggle={() => toggle("orphans")}
				/>
			</PanelSection>

			<PanelSection
				icon={<IconSliders size={16} strokeWidth={1.6} />}
				label="表示の調整"
			>
				<Slider
					digits={1}
					icon={
						<IconNodeSize className="flex-none" size={16} strokeWidth={1.6} />
					}
					label="ノードサイズ"
					max={2}
					min={0.4}
					onChange={(value) => setParam("nodeSize", value)}
					step={0.1}
					value={params.nodeSize}
				/>
				<Slider
					digits={0}
					icon={
						<IconDistance className="flex-none" size={16} strokeWidth={1.6} />
					}
					label="リンク距離"
					max={320}
					min={40}
					onChange={(value) => setParam("linkDistance", value)}
					step={10}
					value={params.linkDistance}
				/>
				<Slider
					digits={1}
					icon={
						<IconRepulse className="flex-none" size={16} strokeWidth={1.6} />
					}
					label="反発力"
					max={2}
					min={0.2}
					onChange={(value) => setParam("repulse", value)}
					step={0.1}
					value={params.repulse}
				/>
			</PanelSection>
		</div>
	);
}
