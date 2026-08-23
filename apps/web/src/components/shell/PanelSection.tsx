import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

export interface PanelSectionProps {
	/** Section glyph from `components/icons` — carries the whole meaning. */
	icon: ReactNode;
	/** Wording for `title` + screen readers. Never rendered as visible text. */
	label: string;
	/** Right-aligned numeric badge. */
	count?: number;
	/** Extra control in the section header (e.g. a "new note" button). */
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	bodyClassName?: string;
}

/**
 * A titled panel block whose title is an icon. Tooltips inside scrolling panels
 * get clipped, so the wording rides on `title` + `.sr-only`.
 */
export function PanelSection({
	icon,
	label,
	count,
	action,
	children,
	className,
	bodyClassName,
}: PanelSectionProps) {
	return (
		<section
			className={cx(
				"mt-2 min-w-0 border-line border-t pt-0.5 first:mt-0 first:border-t-0",
				className,
			)}
		>
			<div
				className="flex h-[34px] flex-none items-center gap-2 px-3 text-ink-muted"
				title={label}
			>
				{icon}
				<span className="sr-only">{label}</span>
				{count === undefined ? null : (
					<span className="ml-auto text-ink-muted text-micro tabular-nums">
						{count}
					</span>
				)}
				{action}
			</div>
			<div className={cx("min-w-0 px-2 pb-3", bodyClassName)}>{children}</div>
		</section>
	);
}
