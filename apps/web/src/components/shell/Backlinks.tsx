import { IconFolder } from "@/components/icons";

export interface BacklinkItem {
  /** Vault path of the linking note. */
  from: string;
  /** Display title of the linking note. */
  fromTitle: string;
  /** Text around the link. */
  excerpt: string;
}

export interface BacklinksProps {
  items?: readonly BacklinkItem[];
  onSelect?: (path: string) => void;
}

function folderOf(path: string): string {
  const cut = path.lastIndexOf("/");
  return cut === -1 ? "" : path.slice(0, cut);
}

/** Notes that link here. Only file names and note excerpts are shown. */
export function Backlinks({ items, onSelect }: BacklinksProps) {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <div className="min-w-0">
      {items.map((item) => {
        const folder = folderOf(item.from);
        return (
          <button
            className="block w-full min-w-0 rounded-md border border-transparent p-2 text-left transition-colors hover:border-line hover:bg-hover"
            key={item.from}
            onClick={() => onSelect?.(item.from)}
            title={item.from}
            type="button"
          >
            {folder ? (
              <span className="flex min-w-0 items-center gap-[5px] text-ink-faint text-micro">
                <IconFolder className="flex-none" size={14} strokeWidth={1.6} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{folder}</span>
              </span>
            ) : null}
            <span className="mt-[3px] block overflow-hidden text-ellipsis whitespace-nowrap font-medium text-ink text-meta">
              {item.fromTitle}
            </span>
            <span className="mt-1 line-clamp-2 block text-ink-muted text-meta leading-[1.7] [overflow-wrap:anywhere]">
              {item.excerpt}
            </span>
          </button>
        );
      })}
    </div>
  );
}
