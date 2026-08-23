import type { Heading } from "@Onyx/vault";
import { useEffect, useState } from "react";

/** The note DOM is committed with the panel, but retry a few frames anyway. */
const MAX_ATTACH_FRAMES = 10;
/** Only the top slice of the reading column counts as "in view". */
const ROOT_MARGIN = "0px 0px -70% 0px";

/**
 * Slug of the heading currently at the top of the reading column, for
 * `RightPanel`'s outline. The note body is injected HTML owned by another
 * component, so the headings are found by id rather than by ref.
 */
export function useActiveHeading(
	headings: readonly Heading[] | undefined,
): string | undefined {
	const [active, setActive] = useState<string | undefined>(undefined);

	// A string, not the array: the identity of `headings` changes on every render.
	const slugs = headings?.map((heading) => heading.slug).join("\n") ?? "";

	useEffect(() => {
		const list = slugs === "" ? [] : slugs.split("\n");
		setActive(list[0]);
		if (list.length === 0) {
			return;
		}

		const visible = new Set<string>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						visible.add(entry.target.id);
					} else {
						visible.delete(entry.target.id);
					}
				}
				const first = list.find((slug) => visible.has(slug));
				if (first !== undefined) {
					setActive(first);
				}
			},
			{ rootMargin: ROOT_MARGIN, threshold: 0 },
		);

		let frame = 0;
		let attempts = 0;
		const attach = () => {
			let found = 0;
			for (const slug of list) {
				const element = document.getElementById(slug);
				if (element) {
					observer.observe(element);
					found += 1;
				}
			}
			attempts += 1;
			if (found === 0 && attempts < MAX_ATTACH_FRAMES) {
				frame = requestAnimationFrame(attach);
			}
		};
		attach();

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, [slugs]);

	return active;
}
