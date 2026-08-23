import type { ComponentType, ReactNode } from "react";

import {
	IconCalendar,
	IconGraph,
	IconNote,
	type IconProps,
	IconSearch,
	IconSliders,
} from "@/components/icons";

export type NavKey = "notes" | "daily" | "search" | "graph" | "settings";

/** Order used by both `Rail` (vertical) and `TabBar` (phone). */
export const NAV_ORDER: readonly NavKey[] = [
	"notes",
	"daily",
	"search",
	"graph",
	"settings",
];

/** `settings` sits after the spacer at the bottom of the rail. */
export const NAV_FOOTER: readonly NavKey[] = ["settings"];

export const NAV_ICON: Record<NavKey, ComponentType<IconProps>> = {
	notes: IconNote,
	daily: IconCalendar,
	search: IconSearch,
	graph: IconGraph,
	settings: IconSliders,
};

/** Tooltip / `aria-label` wording. Never rendered as visible text. */
export const NAV_LABEL: Record<NavKey, string> = {
	notes: "ノート",
	daily: "デイリーノート",
	search: "検索",
	graph: "グラフビュー",
	settings: "設定",
};

export interface NavRenderArgs {
	navKey: NavKey;
	label: string;
	active: boolean;
	href?: string;
	icon: ReactNode;
	/** Button/link classes the default renderer would have used. */
	className: string;
	onSelect: () => void;
}

export interface NavProps {
	active?: NavKey;
	onSelect?: (key: NavKey) => void;
	/** Render an item as a link instead of a button. */
	hrefs?: Partial<Record<NavKey, string>>;
	/** Restrict / reorder the items. Defaults to `NAV_ORDER`. */
	items?: readonly NavKey[];
	/**
	 * Full override — use it to wrap each item in a TanStack Router `<Link>`:
	 * `renderItem={({ navKey, label, icon, className, href }) => (
	 *   <Link aria-label={label} className={className} key={navKey} to={href}>{icon}</Link>
	 * )}`
	 */
	renderItem?: (args: NavRenderArgs) => ReactNode;
	className?: string;
}
