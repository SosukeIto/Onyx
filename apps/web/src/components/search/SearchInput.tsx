import { type KeyboardEvent, useEffect, useRef } from "react";

import {
	IconCase,
	IconClose,
	IconFulltext,
	IconRegex,
	IconSearch,
} from "@/components/icons";
import { cx } from "@/lib/cx";

export interface SearchOptions {
	/** Match `A` and `a` as different characters. */
	caseSensitive: boolean;
	/** Treat the query as a regular expression. */
	regex: boolean;
	/** Search note bodies, not just titles. */
	fulltext: boolean;
}

export interface SearchInputProps {
	value: string;
	onChange?: (value: string) => void;
	/** Fired on Enter. */
	onSubmit?: (value: string) => void;
	autoFocus?: boolean;
	options?: SearchOptions;
	onOptionsChange?: (options: SearchOptions) => void;
	className?: string;
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
	caseSensitive: false,
	regex: false,
	fulltext: true,
};

const OPTION_META = [
	{ key: "caseSensitive", label: "大文字小文字を区別", Icon: IconCase },
	{ key: "regex", label: "正規表現", Icon: IconRegex },
	{ key: "fulltext", label: "本文も検索", Icon: IconFulltext },
] as const;

/**
 * Search field (`.searchbox` + `.optrow` in docs/demo.html).
 *
 * There is no placeholder — the leading glyph carries the meaning, and the
 * wording lives on `aria-label` / `title` only. `autoFocus` is applied through
 * a ref so the JSX attribute (and its a11y lint) stays out of the tree.
 */
export function SearchInput({
	value,
	onChange,
	onSubmit,
	autoFocus,
	options = DEFAULT_SEARCH_OPTIONS,
	onOptionsChange,
	className,
}: SearchInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (autoFocus) {
			inputRef.current?.focus();
		}
	}, [autoFocus]);

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Enter") {
			event.preventDefault();
			onSubmit?.(value);
		} else if (event.key === "Escape" && value) {
			event.preventDefault();
			onChange?.("");
		}
	}

	return (
		<div className={cx("min-w-0 px-2 pt-2 pb-1.5", className)}>
			<div className="relative min-w-0">
				<IconSearch
					className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint"
					size={16}
					strokeWidth={1.6}
				/>
				<input
					aria-label="vault 内を検索"
					className={cx(
						"h-8 w-full min-w-0 rounded-md border border-line bg-elev pr-8 pl-8 text-ink text-ui",
						"focus:border-brand focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:outline-none",
					)}
					onChange={(event) => onChange?.(event.target.value)}
					onKeyDown={handleKeyDown}
					ref={inputRef}
					title="vault 内を検索"
					type="search"
					value={value}
				/>
				{value ? (
					<button
						aria-label="検索語を消す"
						className="absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center rounded-md text-ink-faint transition-colors hover:bg-hover hover:text-ink"
						onClick={() => {
							onChange?.("");
							inputRef.current?.focus();
						}}
						title="検索語を消す"
						type="button"
					>
						<IconClose size={14} strokeWidth={1.6} />
					</button>
				) : null}
			</div>

			<div className="flex gap-1 pt-1.5">
				{OPTION_META.map(({ key, label, Icon }) => {
					const on = options[key];
					return (
						<button
							aria-label={label}
							aria-pressed={on}
							className={cx(
								"grid h-8 w-[34px] flex-none place-items-center rounded-md border transition-colors",
								on
									? "border-transparent bg-brand-soft text-brand"
									: "border-line bg-elev text-ink-muted hover:bg-hover hover:text-ink",
							)}
							key={key}
							onClick={() =>
								onOptionsChange?.({ ...options, [key]: !on } as SearchOptions)
							}
							title={label}
							type="button"
						>
							<Icon size={16} strokeWidth={1.6} />
						</button>
					);
				})}
			</div>
		</div>
	);
}
