import type { Heading } from "@Onyx/vault";

import {
	IconBacklink,
	IconInfo,
	IconList,
	IconUnresolved,
} from "@/components/icons";

import { type BacklinkItem, Backlinks } from "./Backlinks";
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
}

/**
 * Outline / backlinks / unresolved links / file facts.
 * Section titles are icons plus a numeric badge — no headings, no wording.
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
}: RightPanelProps) {
	const glyph = { size: 16, strokeWidth: 1.6 } as const;
	return (
		<div className="onyx-scroll min-h-0 min-w-0 flex-1 pb-6">
			<PanelSection
				count={headings?.length}
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
				count={backlinks?.length}
				icon={<IconBacklink {...glyph} />}
				label="バックリンク"
			>
				<Backlinks items={backlinks} onSelect={onBacklinkSelect} />
			</PanelSection>

			<PanelSection
				count={unresolved?.length}
				icon={<IconUnresolved {...glyph} />}
				label="未作成リンク"
			>
				<Unresolved onSelect={onUnresolvedSelect} targets={unresolved} />
			</PanelSection>

			<PanelSection
				bodyClassName="px-1"
				icon={<IconInfo {...glyph} />}
				label="ファイル情報"
			>
				<NoteInfo {...info} />
			</PanelSection>
		</div>
	);
}
