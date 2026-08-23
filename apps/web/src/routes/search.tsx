import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { IconSearch } from "@/components/icons";
import { NoteRow, ScreenScroll } from "@/lib/list";
import { searchOptions } from "@/lib/queries";

const DEBOUNCE_MS = 250;

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
	component: SearchRoute,
	validateSearch: (input: Record<string, unknown>) => searchSchema.parse(input),
});

/**
 * `text` with every `[start, end)` range wrapped in `<mark>`.
 *
 * The server sends plain text plus offsets, and it stays plain text here — the
 * snippet is never handed to the HTML parser.
 */
function Snippet({
	text,
	ranges,
}: {
	text: string;
	ranges: readonly (readonly [number, number])[];
}) {
	const parts: ReactNode[] = [];
	let cursor = 0;

	for (const [start, end] of ranges) {
		if (start < cursor || end > text.length || start >= end) {
			continue;
		}
		if (start > cursor) {
			parts.push(text.slice(cursor, start));
		}
		parts.push(
			<mark
				className="rounded-[3px] bg-[var(--mark-bg)] px-[1px] text-[var(--mark-text)]"
				key={`${start}-${end}`}
			>
				{text.slice(start, end)}
			</mark>,
		);
		cursor = end;
	}
	if (cursor < text.length) {
		parts.push(text.slice(cursor));
	}

	return (
		<span className="mt-1 block text-ink-muted text-meta leading-[1.7] [overflow-wrap:anywhere]">
			{parts}
		</span>
	);
}

function SearchRoute() {
	const { q } = Route.useSearch();
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);

	const [value, setValue] = useState(q ?? "");
	const [debounced, setDebounced] = useState(q ?? "");

	// Landing here means the reader wants to type — ⌘K does the same from anywhere.
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [value]);

	// The URL mirrors the field so a result page can be shared, but always with
	// `replace` — typing must not fill the history with one entry per keystroke.
	useEffect(() => {
		void navigate({
			replace: true,
			search: { q: debounced === "" ? undefined : debounced },
			to: "/search",
		});
	}, [debounced, navigate]);

	const results = useQuery(searchOptions(debounced.trim()));

	return (
		<ScreenScroll>
			<div className="mb-3 flex min-w-0 items-center gap-2 rounded-lg border border-line bg-elev px-3 focus-within:border-brand">
				<IconSearch className="flex-none text-ink-faint" size={18} />
				<input
					aria-label="検索"
					className="h-11 min-w-0 flex-1 bg-transparent text-ink text-ui outline-none"
					data-onyx-search=""
					onChange={(event) => setValue(event.target.value)}
					ref={inputRef}
					type="search"
					value={value}
				/>
				{results.data === undefined ? null : (
					<span className="flex-none text-ink-faint text-micro tabular-nums">
						{results.data.length}
					</span>
				)}
			</div>

			{results.data?.map((hit) => (
				<NoteRow
					key={hit.path}
					meta={hit.count}
					path={hit.path}
					title={hit.title}
				>
					{hit.snippets.map((snippet) => (
						<Snippet
							key={`${snippet.text}-${snippet.ranges[0]?.[0] ?? 0}`}
							ranges={snippet.ranges}
							text={snippet.text}
						/>
					))}
				</NoteRow>
			))}
		</ScreenScroll>
	);
}
