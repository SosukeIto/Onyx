import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import { Frontmatter } from "./Frontmatter";
import { NoteBody } from "./NoteBody";

export interface NoteViewProps {
	frontmatter?: Record<string, unknown>;
	/** Sanitized HTML from `@Onyx/vault`'s renderNote(). */
	html: string;
	onLinkClick?: (path: string) => void;
	onTagClick?: (tag: string) => void;
	/** Widen the reading column (tables, wide code). */
	wide?: boolean;
	/** Slot above the property block. */
	header?: ReactNode;
	className?: string;
}

/**
 * The reading column: property block + note body, centred on a measure of
 * `--w-read` (760px desktop, 680px on narrow desktops, full width below).
 */
export function NoteView({
	frontmatter,
	html,
	onLinkClick,
	onTagClick,
	wide,
	header,
	className,
}: NoteViewProps) {
	return (
		<div className={cx("onyx-scroll min-h-0 min-w-0 flex-1", className)}>
			<div
				className={cx(
					"mx-auto w-full min-w-0 px-8 pt-8 pb-[30vh] max-sm:px-4 max-sm:pt-4 max-sm:pb-[22vh] max-lg:px-6 max-lg:pb-[24vh]",
					wide ? "max-w-[900px]" : "max-w-[var(--w-read)]",
				)}
			>
				{header}
				<Frontmatter frontmatter={frontmatter} onTagClick={onTagClick} />
				<NoteBody
					html={html}
					onLinkClick={onLinkClick}
					onTagClick={onTagClick}
				/>
			</div>
		</div>
	);
}
