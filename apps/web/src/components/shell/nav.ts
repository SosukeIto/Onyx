import type { ComponentType, ReactNode } from "react";

import {
	IconCalendar,
	IconChat,
	IconGraph,
	IconNote,
	type IconProps,
	IconSearch,
	IconSliders,
} from "@/components/icons";

export type NavKey =
	| "notes"
	| "daily"
	| "logs"
	| "search"
	| "graph"
	| "settings";

/** Full order, used by `Rail` (vertical). */
export const NAV_ORDER: readonly NavKey[] = [
	"notes",
	"daily",
	"logs",
	"search",
	"graph",
	"settings",
];

/**
 * Phone order, used by `TabBar`. A bottom bar holds five targets before the
 * hit areas get too narrow, so `settings` is dropped here — it lives in the
 * rail from `sm` up, and in the file drawer on the phone (`LeftPanel`).
 */
export const NAV_PHONE: readonly NavKey[] = [
	"notes",
	"daily",
	"logs",
	"search",
	"graph",
];

/** `settings` sits after the spacer at the bottom of the rail. */
export const NAV_FOOTER: readonly NavKey[] = ["settings"];

export const NAV_ICON: Record<NavKey, ComponentType<IconProps>> = {
	notes: IconNote,
	daily: IconCalendar,
	logs: IconChat,
	search: IconSearch,
	graph: IconGraph,
	settings: IconSliders,
};

/** Tooltip / `aria-label` wording. Never rendered as visible text. */
export const NAV_LABEL: Record<NavKey, string> = {
	notes: "ノート",
	daily: "デイリーノート",
	logs: "Claude の会話ログ",
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
