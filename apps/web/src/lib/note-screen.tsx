import type { NoteDetail } from "@Onyx/api/schemas";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useCallback, useEffect, useRef } from "react";

import { NoteView } from "@/components/note";

import { stripMd } from "./paths";

export interface NoteScreenProps {
	detail: NoteDetail;
	/** Slot above the property block — the daily note puts its arrows there. */
	header?: ReactNode;
}

/**
 * The reading column wired to the router. Shared by `/note/$` and
 * `/daily/$date` so both resolve links, tags and dead links identically.
 *
 * `NoteBody` delegates `a.wikilink[data-path]` and `a.tag[data-tag]` itself,
 * but an unresolved wikilink is `a.wikilink.unresolved[data-target]` with no
 * href and no `data-path`, so it never reaches `onLinkClick`. The listener
 * below picks those up on the way out of the article.
 */
export function NoteScreen({ detail, header }: NoteScreenProps) {
	const navigate = useNavigate();
	const ref = useRef<HTMLDivElement>(null);

	const openNote = useCallback(
		(path: string) => {
			void navigate({ params: { _splat: stripMd(path) }, to: "/note/$" });
		},
		[navigate],
	);

	const openTag = useCallback(
		(tag: string) => {
			void navigate({ params: { tag }, to: "/tags/$tag" });
		},
		[navigate],
	);

	useEffect(() => {
		const root = ref.current;
		if (!root) {
			return;
		}
		function onClick(event: MouseEvent) {
			if (
				event.defaultPrevented ||
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			) {
				return;
			}
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}
			if (!target.closest("a.wikilink.unresolved")) {
				return;
			}
			event.preventDefault();
			void navigate({ to: "/unresolved" });
		}
		root.addEventListener("click", onClick);
		return () => root.removeEventListener("click", onClick);
	}, [navigate]);

	return (
		// `display: contents` keeps the shell's flex layout exactly as designed.
		<div className="contents" ref={ref}>
			<NoteView
				frontmatter={detail.frontmatter}
				header={header}
				html={detail.html}
				onLinkClick={openNote}
				onTagClick={openTag}
			/>
		</div>
	);
}
