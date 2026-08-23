import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import { NAV_ICON, NAV_LABEL, type NavKey, type NavRenderArgs } from "./nav";
import { Tooltip, type TooltipSide } from "./Tooltip";

export interface NavButtonProps {
	navKey: NavKey;
	active: boolean;
	href?: string;
	iconSize: number;
	className: string;
	onSelect: () => void;
	renderItem?: (args: NavRenderArgs) => ReactNode;
	/** `undefined` renders no tooltip (the phone tab bar). */
	tooltipSide?: TooltipSide;
}

export function NavButton({
	navKey,
	active,
	href,
	iconSize,
	className,
	onSelect,
	renderItem,
	tooltipSide,
}: NavButtonProps) {
	const Icon = NAV_ICON[navKey];
	const label = NAV_LABEL[navKey];
	const icon = <Icon size={iconSize} />;
	const classes = cx(
		"grid place-items-center rounded-lg text-ink-muted transition-colors",
		"hover:bg-hover hover:text-ink",
		active && "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
		className,
	);

	let control: ReactNode;
	if (renderItem) {
		control = renderItem({
			navKey,
			label,
			active,
			href,
			icon,
			className: classes,
			onSelect,
		});
	} else if (href) {
		control = (
			<a
				aria-current={active ? "page" : undefined}
				aria-label={label}
				className={classes}
				href={href}
				onClick={onSelect}
			>
				{icon}
			</a>
		);
	} else {
		control = (
			<button
				aria-current={active ? "page" : undefined}
				aria-label={label}
				className={classes}
				onClick={onSelect}
				type="button"
			>
				{icon}
			</button>
		);
	}

	if (!tooltipSide) {
		return control;
	}
	return (
		<Tooltip label={label} side={tooltipSide}>
			{control}
		</Tooltip>
	);
}
