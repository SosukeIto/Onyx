import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { IconButton } from "@/components/shell";
import { cx } from "@/lib/cx";

export interface DailyNavProps {
	/** `YYYY-MM-DD` of the previous daily note, or undefined when there is none. */
	prev?: string;
	/** `YYYY-MM-DD` of the next daily note, or undefined when there is none. */
	next?: string;
	onGo?: (date: string) => void;
	className?: string;
}

/**
 * Previous / next daily note. The side without a note is disabled rather than
 * hidden, so the pair keeps its width and the header never reflows.
 */
export function DailyNav({ prev, next, onGo, className }: DailyNavProps) {
	return (
		<div className={cx("flex flex-none items-center gap-0.5", className)}>
			<IconButton
				disabled={!prev}
				label={prev ? `前のデイリーノート ${prev}` : "前のデイリーノート"}
				onClick={() => {
					if (prev) {
						onGo?.(prev);
					}
				}}
				title={prev}
			>
				<IconChevronLeft size={18} strokeWidth={1.6} />
			</IconButton>
			<IconButton
				disabled={!next}
				label={next ? `次のデイリーノート ${next}` : "次のデイリーノート"}
				onClick={() => {
					if (next) {
						onGo?.(next);
					}
				}}
				title={next}
			>
				<IconChevronRight size={18} strokeWidth={1.6} />
			</IconButton>
		</div>
	);
}
