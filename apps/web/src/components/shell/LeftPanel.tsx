import type { TreeFolder } from "@Onyx/vault";
import type { ReactNode } from "react";

import { IconFolder, IconNewNote, IconSearch } from "@/components/icons";

import { FileTree } from "./FileTree";
import { IconButton } from "./IconButton";

export interface LeftPanelProps {
	tree?: TreeFolder;
	activePath?: string;
	onOpen?: (path: string) => void;
	/** Opens the search screen. Rendered as an icon button, never a text field. */
	onSearch?: () => void;
	/**
	 * Creates a note. Onyx is a read-only viewer, so the button only exists
	 * when a handler is passed — otherwise nothing is rendered for it.
	 */
	onNewNote?: () => void;
	/** Total note count shown next to the folder glyph. */
	noteCount?: number;
	defaultOpen?: readonly string[];
	/** Slot above the tree — the daily-note calendar goes here. */
	children?: ReactNode;
}

/**
 * File column. Everything above the tree is icon-only; the only words in this
 * panel are folder and file names.
 */
export function LeftPanel({
	tree,
	activePath,
	onOpen,
	onSearch,
	onNewNote,
	noteCount,
	defaultOpen,
	children,
}: LeftPanelProps) {
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col">
			<div className="flex flex-none items-center gap-1 px-2 pt-2 pb-1.5">
				<IconButton
					className="size-8"
					label="vault 内を検索"
					onClick={onSearch}
					title="vault 内を検索"
				>
					<IconSearch size={18} />
				</IconButton>
				<span aria-hidden="true" className="flex-1" />
				{onNewNote ? (
					<IconButton
						className="size-8"
						label="新規ノート"
						onClick={onNewNote}
						title="新規ノート"
					>
						<IconNewNote size={18} />
					</IconButton>
				) : null}
			</div>

			{children}

			<div
				className="flex h-[34px] flex-none items-center gap-2 px-3 text-ink-muted"
				title="ファイル"
			>
				<IconFolder size={16} strokeWidth={1.6} />
				<span className="sr-only">ファイル</span>
				{noteCount === undefined ? null : (
					<span className="ml-auto text-ink-muted text-micro tabular-nums">
						{noteCount}
					</span>
				)}
			</div>

			<div className="onyx-scroll min-h-0 min-w-0 flex-1">
				<FileTree
					activePath={activePath}
					defaultOpen={defaultOpen}
					onOpen={onOpen}
					tree={tree}
				/>
			</div>
		</div>
	);
}
