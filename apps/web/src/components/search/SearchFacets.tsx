import type { ReactNode } from "react";

import { IconCalendar, IconFolder, IconHash } from "@/components/icons";
import { PanelSection } from "@/components/shell";
import { cx } from "@/lib/cx";

export interface FolderFacet {
  path: string;
  count: number;
}

export interface TagFacet {
  tag: string;
  count: number;
}

export interface MonthFacet {
  /** `YYYY-MM`. */
  ym: string;
  count: number;
}

/** Facet state. `undefined` on a key means "no filter on that axis". */
export interface FacetSelection {
  folder?: string;
  tag?: string;
  month?: string;
}

export interface SearchFacetsProps {
  folders?: readonly FolderFacet[];
  tags?: readonly TagFacet[];
  months?: readonly MonthFacet[];
  selectedFolder?: string;
  selectedTag?: string;
  selectedMonth?: string;
  /** Receives the whole next selection; clicking an active facet clears it. */
  onChange?: (selection: FacetSelection) => void;
  /**
   * Opens the tag index (`/tags`). Wired to the tag section's own glyph — the
   * heading is the only thing in the section that is not a filter, so it is
   * the one place a "see them all" target can live without adding wording.
   * Without a handler the glyph stays a plain icon.
   */
  onOpenTags?: () => void;
  className?: string;
}

interface FacetRowProps {
  icon?: ReactNode;
  name: string;
  count: number;
  active: boolean;
  onToggle: () => void;
}

function FacetRow({ icon, name, count, active, onToggle }: FacetRowProps) {
  const empty = count === 0;
  return (
    <button
      aria-pressed={active}
      className={cx(
        "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-meta transition-colors",
        active ? "bg-brand-soft text-brand" : "text-ink-muted hover:bg-hover",
        empty && "opacity-55",
      )}
      disabled={empty}
      onClick={onToggle}
      title={name}
      type="button"
    >
      {icon ?? <span aria-hidden="true" className="w-0.5 flex-none" />}
      <span className="min-w-0 flex-1 truncate text-left tabular-nums">{name}</span>
      <span
        className={cx(
          "flex-none text-micro tabular-nums",
          active ? "text-brand" : "text-ink-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * Folder / tag / month facets of the search screen (`.facet` in
 * docs/demo.html). Section titles are icons only; the sole words on screen are
 * folder names, tag names and `YYYY-MM`.
 */
export function SearchFacets({
  folders,
  tags,
  months,
  selectedFolder,
  selectedTag,
  selectedMonth,
  onChange,
  onOpenTags,
  className,
}: SearchFacetsProps) {
  const current: FacetSelection = {
    folder: selectedFolder,
    tag: selectedTag,
    month: selectedMonth,
  };

  function toggle(key: keyof FacetSelection, value: string) {
    onChange?.({
      ...current,
      [key]: current[key] === value ? undefined : value,
    });
  }

  return (
    <div className={cx("min-w-0", className)}>
      {folders && folders.length > 0 ? (
        <PanelSection icon={<IconFolder size={16} strokeWidth={1.6} />} label="フォルダで絞り込む">
          {folders.map((folder) => (
            <FacetRow
              active={folder.path === selectedFolder}
              count={folder.count}
              icon={<IconFolder className="flex-none" size={16} strokeWidth={1.6} />}
              key={folder.path}
              name={folder.path}
              onToggle={() => toggle("folder", folder.path)}
            />
          ))}
        </PanelSection>
      ) : null}

      {tags && tags.length > 0 ? (
        <PanelSection
          icon={
            onOpenTags ? (
              <button
                aria-label="すべてのタグ"
                className="-m-1 grid flex-none place-items-center rounded-md p-1 text-ink-muted transition-colors hover:bg-hover hover:text-ink"
                onClick={onOpenTags}
                title="すべてのタグ"
                type="button"
              >
                <IconHash size={16} strokeWidth={1.6} />
              </button>
            ) : (
              <IconHash size={16} strokeWidth={1.6} />
            )
          }
          label="タグで絞り込む"
        >
          {tags.map((tag) => (
            <FacetRow
              active={tag.tag === selectedTag}
              count={tag.count}
              icon={<IconHash className="flex-none" size={16} strokeWidth={1.6} />}
              key={tag.tag}
              name={tag.tag}
              onToggle={() => toggle("tag", tag.tag)}
            />
          ))}
        </PanelSection>
      ) : null}

      {months && months.length > 0 ? (
        <PanelSection icon={<IconCalendar size={16} strokeWidth={1.6} />} label="期間で絞り込む">
          {months.map((month) => (
            <FacetRow
              active={month.ym === selectedMonth}
              count={month.count}
              key={month.ym}
              name={month.ym}
              onToggle={() => toggle("month", month.ym)}
            />
          ))}
        </PanelSection>
      ) : null}
    </div>
  );
}
