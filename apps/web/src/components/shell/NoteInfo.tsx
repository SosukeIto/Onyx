import type { ReactNode } from "react";

import {
  IconClock,
  IconFolder,
  IconGit,
  IconLink,
  IconType,
  IconUnresolved,
} from "@/components/icons";

export interface NoteInfoProps {
  /** Vault path of the note. */
  path?: string;
  /** Last commit date, ISO 8601 or already formatted. */
  modified?: string | null;
  /** Source size in bytes. */
  size?: number;
  linkCount?: number;
  unresolvedCount?: number;
  /** Short blob / commit hash. */
  commit?: string | null;
}

function folderOf(path: string): string {
  const cut = path.lastIndexOf("/");
  return cut === -1 ? "/" : `${path.slice(0, cut)}/`;
}

interface RowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

function Row({ icon, label, children }: RowProps) {
  return (
    <>
      <dt className="flex min-w-0 items-center pt-px text-ink-faint" title={label}>
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="m-0 min-w-0 text-ink [overflow-wrap:anywhere]">{children}</dd>
    </>
  );
}

/** File facts for the open note. Every key is an icon; only values are text. */
export function NoteInfo({
  path,
  modified,
  size,
  linkCount,
  unresolvedCount,
  commit,
}: NoteInfoProps) {
  const icon = { size: 14, strokeWidth: 1.6 } as const;
  return (
    <dl className="grid grid-cols-[22px_minmax(0,1fr)] items-start gap-x-[10px] gap-y-2 p-2 text-meta tabular-nums">
      {path ? (
        <Row icon={<IconFolder {...icon} />} label="パス">
          {folderOf(path)}
        </Row>
      ) : null}
      {modified ? (
        <Row icon={<IconClock {...icon} />} label="更新日時">
          {modified}
        </Row>
      ) : null}
      {size === undefined ? null : (
        <Row icon={<IconType {...icon} />} label="サイズ (bytes)">
          {size.toLocaleString("en-US")}
        </Row>
      )}
      {linkCount === undefined ? null : (
        <Row icon={<IconLink {...icon} />} label="リンク数">
          {linkCount}
        </Row>
      )}
      {unresolvedCount === undefined ? null : (
        <Row icon={<IconUnresolved {...icon} />} label="未作成リンク数">
          {unresolvedCount}
        </Row>
      )}
      {commit ? (
        <Row icon={<IconGit {...icon} />} label="commit">
          <code className="font-mono text-[11px] text-ink-muted">{commit}</code>
        </Row>
      ) : null}
    </dl>
  );
}
