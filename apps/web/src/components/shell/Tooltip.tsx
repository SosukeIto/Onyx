import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

export type TooltipSide = "bottom" | "top" | "right";
export type TooltipAlign = "center" | "start" | "end";

export interface TooltipProps {
	/** Tooltip text. Also the only place UI wording is allowed to live. */
	label: string;
	side?: TooltipSide;
	align?: TooltipAlign;
	className?: string;
	children: ReactNode;
}

const PLACEMENT: Record<string, string> = {
	"bottom-center": "top-[calc(100%+6px)] left-1/2 -translate-x-1/2",
	"bottom-start": "top-[calc(100%+6px)] left-0",
	"bottom-end": "top-[calc(100%+6px)] right-0",
	"top-center": "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
	"top-start": "bottom-[calc(100%+8px)] left-0",
	"top-end": "bottom-[calc(100%+8px)] right-0",
	"right-center": "left-[calc(100%+10px)] top-1/2 -translate-y-1/2",
	"right-start": "left-[calc(100%+10px)] top-0",
	"right-end": "left-[calc(100%+10px)] bottom-0",
};

/**
 * CSS-only tooltip (the `.tip` pattern from docs/demo.html).
 *
 * Never use it inside a scrolling panel — the bubble is clipped there. Panels
 * use the native `title` attribute instead; see components/icons/README.md.
 */
export function Tooltip({
	label,
	side = "bottom",
	align = "center",
	className,
	children,
}: TooltipProps) {
	return (
		<span className={cx("group relative inline-flex", className)}>
			{children}
			<span
				className={cx(
					"pointer-events-none absolute z-[70] whitespace-nowrap rounded-md bg-tip px-2 py-1 text-[11px] text-tip-foreground leading-[1.45] opacity-0 shadow-panel transition-opacity delay-200 duration-100 group-focus-within:opacity-100 group-hover:opacity-100",
					PLACEMENT[`${side}-${align}`],
				)}
				role="tooltip"
			>
				{label}
			</span>
		</span>
	);
}
