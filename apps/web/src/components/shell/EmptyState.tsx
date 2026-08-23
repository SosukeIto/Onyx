import type { ComponentType, ReactNode } from "react";

import type { IconProps } from "@/components/icons";
import { cx } from "@/lib/cx";

export type EmptyStateTone = "muted" | "danger";

export interface EmptyStateProps {
	/** Glyph from `components/icons` — it carries the whole message. */
	icon: ComponentType<IconProps>;
	/** `muted` for "nothing here", `danger` for a failure. */
	tone?: EmptyStateTone;
	/**
	 * Optional detail under the glyph. Only real content belongs here — a file
	 * name, a path, an error message from the server, a number. No UI copy.
	 */
	children?: ReactNode;
	/** Wording for `title` + screen readers. Never rendered as visible text. */
	label?: string;
	/** Glyph size in px. */
	size?: number;
	className?: string;
}

const TONE: Record<EmptyStateTone, string> = {
	danger: "text-danger",
	muted: "text-ink-faint",
};

/**
 * The one empty / error figure: a single faint glyph, centred, with an optional
 * line of real text under it. Used for empty panels, 404 and error screens so
 * every "there is nothing to read here" state looks the same.
 *
 * It fills its parent (`flex-1`), so drop it straight into a flex column.
 */
export function EmptyState({
	icon: Icon,
	tone = "muted",
	children,
	label,
	size = 40,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cx(
				"flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center",
				className,
			)}
		>
			<Icon
				aria-hidden={label ? undefined : "true"}
				aria-label={label}
				className={cx("flex-none opacity-70", TONE[tone])}
				role={label ? "img" : undefined}
				size={size}
				strokeWidth={1.4}
			/>
			{children ? (
				<p className="m-0 min-w-0 max-w-[42ch] text-ink-muted text-meta leading-[1.7] [overflow-wrap:anywhere]">
					{children}
				</p>
			) : null}
		</div>
	);
}
