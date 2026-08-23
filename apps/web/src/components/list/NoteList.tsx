import type { ReactNode } from "react";

import { IconNote } from "@/components/icons";
import { cx } from "@/lib/cx";

export interface NoteListItem {
	/** Vault path — also the React key and what `onOpen` receives. */
	path: string;
	title: string;
	folder?: string;
	/** Pre-formatted date string; it is printed as-is. */
	modified?: string;
	/** Numeric badge at the right edge — hits, backlinks, notes in a tag. */
	count?: number;
	tags?: readonly string[];
}

export interface NoteListProps {
	items: readonly NoteListItem[];
	activePath?: string;
	onOpen?: (path: string) => void;
	/** Replaces the leading note glyph — e.g. a calendar or tag icon. */
	leading?: (item: NoteListItem) => ReactNode;
	className?: string;
}

/**
 * One-line note rows shared by the home list, tag pages and backlink lists.
 *
 * Every text cell is `min-w-0 truncate`, so a long Japanese file name shortens
 * instead of widening the row; only the right-hand number keeps its width.
 * The folder column is hidden on phones, where there is no room for it.
 */
export function NoteList({
	items,
	activePath,
	onOpen,
	leading,
	className,
}: NoteListProps) {
	if (items.length === 0) {
		return null;
	}
	return (
		<div className={cx("min-w-0", className)}>
			{items.map((item) => {
				const active = item.path === activePath;
				const meta =
					item.count === undefined ? item.modified : String(item.count);
				return (
					<button
						aria-current={active ? "page" : undefined}
						className={cx(
							"flex h-[30px] w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-ui transition-colors max-sm:h-9",
							active
								? "bg-brand-soft font-medium text-brand"
								: "text-ink-muted hover:bg-hover hover:text-ink",
						)}
						key={item.path}
						onClick={() => onOpen?.(item.path)}
						title={item.path}
						type="button"
					>
						<span className="flex-none text-ink-faint">
							{leading?.(item) ?? <IconNote size={15} strokeWidth={1.6} />}
						</span>
						<span
							className={cx(
								"min-w-0 flex-1 truncate",
								active ? "text-brand" : "text-ink",
							)}
						>
							{item.title}
						</span>
						{item.folder ? (
							<span className="min-w-0 max-w-[45%] shrink truncate text-ink-faint text-meta max-sm:hidden">
								{item.folder}
							</span>
						) : null}
						{meta ? (
							<span className="flex-none text-ink-faint text-micro tabular-nums">
								{meta}
							</span>
						) : null}
					</button>
				);
			})}
		</div>
	);
}
