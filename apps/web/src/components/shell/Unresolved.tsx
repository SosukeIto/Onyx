import { IconUnresolved } from "@/components/icons";

export interface UnresolvedProps {
  /** Raw `[[targets]]` in this note that have no matching file. */
  targets?: readonly string[];
  onSelect?: (target: string) => void;
}

/** Wikilinks pointing at notes that do not exist yet. */
export function Unresolved({ targets, onSelect }: UnresolvedProps) {
  if (!targets || targets.length === 0) {
    return null;
  }
  return (
    <div className="min-w-0">
      {targets.map((target) => (
        <button
          className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-[7px] text-left text-ink-muted text-meta transition-colors hover:bg-hover hover:text-ink"
          key={target}
          onClick={() => onSelect?.(target)}
          title={target}
          type="button"
        >
          <IconUnresolved className="flex-none text-link-unresolved" size={14} strokeWidth={1.6} />
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {target}
          </span>
        </button>
      ))}
    </div>
  );
}
