import type { Heading } from "@Onyx/vault";

import {
	IconBacklink,
	IconGraph,
	IconInfo,
	IconList,
	IconUnresolved,
} from "@/components/icons";

import { type BacklinkItem, Backlinks } from "./Backlinks";
import { EmptyState } from "./EmptyState";
import { IconButton } from "./IconButton";
import { NoteInfo, type NoteInfoProps } from "./NoteInfo";
import { Outline } from "./Outline";
import { PanelSection } from "./PanelSection";
import { Unresolved } from "./Unresolved";

export interface RightPanelProps {
	headings?: readonly Heading[];
	activeSlug?: string;
	onHeadingSelect?: (slug: string) => void;

	backlinks?: readonly BacklinkItem[];
	onBacklinkSelect?: (path: string) => void;

	unresolved?: readonly string[];
	onUnresolvedSelect?: (target: string) => void;

	info?: NoteInfoProps;
	/**
	 * Opens the local graph of the note the panel describes. Rendered as an
	 * icon button in the file-facts header; omitted when there is no handler.
	 */
	onOpenGraph?: () => void;
}

/** True when `NoteInfo` would render at least one row. */
function hasInfo(info?: NoteInfoProps): boolean {
	if (!info) {
		return false;
	}
	return (
		Boolean(info.path) ||
		Boolean(info.modified) ||
		Boolean(info.commit) ||
		info.size !== undefined ||
		info.linkCount !== undefined ||
		info.unresolvedCount !== undefined
	);
}

/**
 * Outline / backlinks / unresolved links / file facts.
 * Section titles are icons plus a numeric badge — no headings, no wording.
 *
 * A section with no data is dropped rather than shown empty; when every
 * section is empty the whole panel collapses to a single faint glyph.
 */
export function RightPanel({
	headings,
	activeSlug,
	onHeadingSelect,
	backlinks,
	onBacklinkSelect,
	unresolved,
	onUnresolvedSelect,
	info,
	onOpenGraph,
}: RightPanelProps) {
	const glyph = { size: 16, strokeWidth: 1.6 } as const;

	const outlineCount = headings?.length ?? 0;
	const backlinkCount = backlinks?.length ?? 0;
	const unresolvedCount = unresolved?.length ?? 0;
	const infoShown = hasInfo(info);

	if (
		outlineCount === 0 &&
		backlinkCount === 0 &&
		unresolvedCount === 0 &&
		!infoShown &&
		!onOpenGraph
	) {
		return <EmptyState icon={IconInfo} />;
	}

	return (
		<div className="onyx-scroll min-h-0 min-w-0 flex-1 pb-6">
			<PanelSection
				count={outlineCount}
				hideWhenEmpty
				icon={<IconList {...glyph} />}
				label="アウトライン"
			>
				<Outline
					activeSlug={activeSlug}
					headings={headings}
					onSelect={onHeadingSelect}
				/>
			</PanelSection>

			<PanelSection
				count={backlinkCount}
				hideWhenEmpty
				icon={<IconBacklink {...glyph} />}
				label="バックリンク"
			>
				<Backlinks items={backlinks} onSelect={onBacklinkSelect} />
			</PanelSection>

			<PanelSection
				count={unresolvedCount}
				hideWhenEmpty
				icon={<IconUnresolved {...glyph} />}
				label="未作成リンク"
			>
				<Unresolved onSelect={onUnresolvedSelect} targets={unresolved} />
			</PanelSection>

			<PanelSection
				action={
					onOpenGraph ? (
						<IconButton
							className="size-[26px]"
							label="このノートのローカルグラフを開く"
							onClick={onOpenGraph}
							title="このノートのローカルグラフを開く"
						>
							<IconGraph size={16} strokeWidth={1.6} />
						</IconButton>
					) : null
				}
				bodyClassName="px-1"
				// The local-graph button lives in this header, so the section has
				// to survive a note with no file facts at all.
				empty={!infoShown && !onOpenGraph}
				hideWhenEmpty
				icon={<IconInfo {...glyph} />}
				label="ファイル情報"
			>
				{infoShown ? <NoteInfo {...info} /> : null}
			</PanelSection>
		</div>
	);
}
