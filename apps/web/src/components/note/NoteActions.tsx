import { IconGraph } from "@/components/icons";
import { IconButton } from "@/components/shell";
import { cx } from "@/lib/cx";

export interface NoteActionsProps {
	/**
	 * Opens the local graph centred on the note being read
	 * (`/graph?center=<path>`). Nothing renders without a handler.
	 */
	onOpenGraph?: () => void;
	/** Spacing is the caller's — pass `mb-4` / `mb-5` to match its header. */
	className?: string;
}

/**
 * Actions for the open note, made for `NoteView`'s `header` slot.
 *
 * The same target sits in `RightPanel`'s file-facts header, but that panel is a
 * bottom sheet on the phone and an overlay on the tablet — it has to be pulled
 * up and scrolled to the end first. Here the button rides at the top of the
 * reading column, where every device reaches it without opening anything.
 */
export function NoteActions({ onOpenGraph, className }: NoteActionsProps) {
	if (!onOpenGraph) {
		return null;
	}
	return (
		<div
			className={cx("flex min-w-0 items-center justify-end gap-0.5", className)}
		>
			<IconButton
				label="このノートのローカルグラフを開く"
				onClick={onOpenGraph}
				title="このノートのローカルグラフを開く"
			>
				<IconGraph size={18} strokeWidth={1.6} />
			</IconButton>
		</div>
	);
}
