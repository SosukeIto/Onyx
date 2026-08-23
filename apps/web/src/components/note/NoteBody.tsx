import { useEffect, useRef } from "react";

import { cx } from "@/lib/cx";

export interface NoteBodyProps {
	/** Sanitized HTML from `@Onyx/vault`'s renderNote(). */
	html: string;
	/** Called for `a.wikilink[data-path]` clicks (resolved links only). */
	onLinkClick?: (path: string) => void;
	/** Called for `a.tag[data-tag]` clicks. */
	onTagClick?: (tag: string) => void;
	className?: string;
}

/**
 * The note itself. Styling lives in `apps/web/src/styles/prose.css`, which is a
 * contract with the renderer — see the class list at the top of that file.
 *
 * Clicks are delegated on the article element so the router never has to touch
 * the injected HTML. Modified clicks and middle clicks fall through to the
 * browser so "open in new tab" keeps working.
 */
export function NoteBody({
	html,
	onLinkClick,
	onTagClick,
	className,
}: NoteBodyProps) {
	const ref = useRef<HTMLElement>(null);

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
			const anchor = target.closest("a");
			if (!anchor) {
				return;
			}
			if (anchor.classList.contains("wikilink")) {
				const path = anchor.getAttribute("data-path");
				if (path && onLinkClick) {
					event.preventDefault();
					onLinkClick(path);
				}
				return;
			}
			if (anchor.classList.contains("tag")) {
				const tag = anchor.getAttribute("data-tag");
				if (tag && onTagClick) {
					event.preventDefault();
					onTagClick(tag);
				}
			}
		}
		root.addEventListener("click", onClick);
		return () => root.removeEventListener("click", onClick);
	}, [onLinkClick, onTagClick]);

	// The renderer emits bare <img> and bare <table>. Normalise both here:
	// images get lazy loading, and every table is put inside the `.table-wrap`
	// scroller prose.css styles — a `display: block` table shrinks its columns
	// to fit instead of scrolling, which squeezes Japanese text to 1–2 glyphs.
	// React owns this subtree through `dangerouslySetInnerHTML`, so it replaces
	// the whole thing whenever `html` changes and never sees these nodes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: the DOM is rebuilt whenever `html` changes
	useEffect(() => {
		const root = ref.current;
		if (!root) {
			return;
		}
		for (const img of root.querySelectorAll("img")) {
			img.loading = "lazy";
			img.decoding = "async";
		}
		for (const table of root.querySelectorAll("table")) {
			if (table.parentElement?.classList.contains("table-wrap")) {
				continue;
			}
			const wrap = document.createElement("div");
			wrap.className = "table-wrap";
			table.replaceWith(wrap);
			wrap.append(table);
		}
	}, [html]);

	return (
		<article
			className={cx("prose-onyx", className)}
			dangerouslySetInnerHTML={{ __html: html }}
			ref={ref}
		/>
	);
}
