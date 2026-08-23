import { type KeyboardEvent, type Ref, useCallback, useEffect, useRef } from "react";

import { IconCase, IconClose, IconFulltext, IconRegex, IconSearch } from "@/components/icons";
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
  /**
   * Case / regex / fulltext toggles. The option row is rendered only when the
   * screen actually owns that state — a field with no `options` and no
   * `onOptionsChange` shows the input alone.
   */
  options?: SearchOptions;
  onOptionsChange?: (options: SearchOptions) => void;
  /**
   * Forwarded to the `<input>`. ⌘K uses it (or the `data-onyx-search`
   * attribute the field carries) to put the caret back in the box.
   */
  inputRef?: Ref<HTMLInputElement>;
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
  options,
  onOptionsChange,
  inputRef,
  className,
}: SearchInputProps) {
  const fieldRef = useRef<HTMLInputElement>(null);
  // Own ref (clear button + autoFocus) and the caller's ref on one node.
  const setField = useCallback(
    (node: HTMLInputElement | null) => {
      fieldRef.current = node;
      if (typeof inputRef === "function") {
        inputRef(node);
      } else if (inputRef) {
        inputRef.current = node;
      }
    },
    [inputRef],
  );

  // An option the screen does not own must not look like a dead toggle.
  const showOptions = options !== undefined || onOptionsChange !== undefined;
  const current = options ?? DEFAULT_SEARCH_OPTIONS;

  useEffect(() => {
    if (autoFocus) {
      fieldRef.current?.focus();
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
          data-onyx-search=""
          onChange={(event) => onChange?.(event.target.value)}
          onKeyDown={handleKeyDown}
          ref={setField}
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
              fieldRef.current?.focus();
            }}
            title="検索語を消す"
            type="button"
          >
            <IconClose size={14} strokeWidth={1.6} />
          </button>
        ) : null}
      </div>

      {showOptions ? (
        <div className="flex gap-1 pt-1.5">
          {OPTION_META.map(({ key, label, Icon }) => {
            const on = current[key];
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
                  onOptionsChange?.({
                    ...current,
                    [key]: !on,
                  } as SearchOptions)
                }
                title={label}
                type="button"
              >
                <Icon size={16} strokeWidth={1.6} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
