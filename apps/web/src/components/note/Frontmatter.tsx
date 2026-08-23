import { type ComponentType, type ReactNode, useState } from "react";

import {
  IconCalendar,
  IconChevron,
  IconClip,
  IconClock,
  IconFolder,
  IconGit,
  IconHash,
  IconInfo,
  IconKey,
  IconLink,
  type IconProps,
  IconTemplate,
  IconType,
} from "@/components/icons";
import { cx } from "@/lib/cx";

export interface FrontmatterProps {
  /** Raw YAML frontmatter of the note. Keys become icons, values stay text. */
  frontmatter?: Record<string, unknown>;
  onTagClick?: (tag: string) => void;
  /** Collapsed by default when false. */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Known frontmatter keys → the shared vocabulary glyph.
 * Anything not listed falls back to `IconInfo` with the key name in `title`.
 */
const KEY_ICON: Record<string, ComponentType<IconProps>> = {
  alias: IconType,
  aliases: IconType,
  attachment: IconClip,
  attachments: IconClip,
  commit: IconGit,
  created: IconClock,
  date: IconCalendar,
  due: IconCalendar,
  folder: IconFolder,
  hash: IconGit,
  id: IconKey,
  link: IconLink,
  modified: IconClock,
  path: IconFolder,
  project: IconFolder,
  session_id: IconKey,
  source: IconLink,
  tag: IconHash,
  tags: IconHash,
  template: IconTemplate,
  title: IconType,
  uid: IconKey,
  updated: IconClock,
  url: IconLink,
  uuid: IconKey,
};

const MONO_KEYS = new Set(["commit", "hash", "id", "session_id", "uid", "uuid"]);

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function asTags(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.map(toText).filter(Boolean);
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return null;
}

function renderValue(key: string, value: unknown, onTagClick?: (tag: string) => void): ReactNode {
  if (key === "tags" || key === "tag") {
    const tags = asTags(value);
    if (tags) {
      return (
        <span className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              className="inline-flex h-6 items-center gap-[3px] rounded-full bg-tag-soft pr-2.5 pl-[7px] text-meta text-tag transition-colors hover:bg-tag/20"
              key={tag}
              onClick={() => onTagClick?.(tag)}
              type="button"
            >
              <IconHash className="flex-none" size={12} strokeWidth={1.9} />
              {tag}
            </button>
          ))}
        </span>
      );
    }
  }
  if (Array.isArray(value)) {
    return value.map(toText).join(", ");
  }
  return toText(value);
}

/**
 * Obsidian property block. The key names are replaced by icons — the key text
 * survives in `title` and for screen readers only.
 */
export function Frontmatter({
  frontmatter,
  onTagClick,
  defaultOpen = true,
  className,
}: FrontmatterProps) {
  const [open, setOpen] = useState(defaultOpen);
  const entries = Object.entries(frontmatter ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={cx("mb-6 overflow-hidden rounded-lg border border-line bg-panel", className)}>
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-ink-faint text-micro tabular-nums transition-colors hover:text-ink-muted"
        onClick={() => setOpen(!open)}
        title="プロパティ"
        type="button"
      >
        <IconChevron
          className={cx("flex-none transition-transform", open && "rotate-90")}
          size={13}
          strokeWidth={1.6}
        />
        <IconInfo className="flex-none" size={14} strokeWidth={1.6} />
        <span className="sr-only">プロパティ</span>
        <span className="ml-auto">{entries.length}</span>
      </button>

      {open ? (
        <dl className="px-3 pb-2.5">
          {entries.map(([key, value]) => {
            const Icon = KEY_ICON[key] ?? IconInfo;
            return (
              <div
                className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-x-2.5 border-line border-t py-1.5 text-ui first:border-t-0"
                key={key}
              >
                <dt className="flex min-w-0 items-center pt-[3px] text-ink-faint" title={key}>
                  <Icon size={14} strokeWidth={1.6} />
                  <span className="sr-only">{key}</span>
                </dt>
                <dd
                  className={cx(
                    "m-0 min-w-0 text-ink tabular-nums [overflow-wrap:anywhere]",
                    MONO_KEYS.has(key) && "font-mono text-[12px] text-ink-muted",
                  )}
                >
                  {renderValue(key, value, onTagClick)}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
    </div>
  );
}
