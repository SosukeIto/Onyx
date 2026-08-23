import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { IconGit, IconNote, IconSliders, IconSync } from "@/components/icons";
import { ModeToggle } from "@/components/mode-toggle";
import { formatDateTime, shortCommit } from "@/lib/paths";
import { statusOptions } from "@/lib/queries";

/** Placeholder. Real settings are Phase 3 — only the vault facts live here. */
export const Route = createFileRoute("/settings")({
	component: SettingsRoute,
});

const GLYPH = { size: 14, strokeWidth: 1.6 } as const;

function Row({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: ReactNode;
}) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	return (
		<>
			<dt
				className="flex min-w-0 items-center pt-px text-ink-faint"
				title={label}
			>
				{icon}
				<span className="sr-only">{label}</span>
			</dt>
			<dd className="m-0 min-w-0 text-ink [overflow-wrap:anywhere]">{value}</dd>
		</>
	);
}

function SettingsRoute() {
	const status = useQuery(statusOptions());

	return (
		<div className="onyx-scroll min-h-0 min-w-0 flex-1">
			<div className="mx-auto flex w-full min-w-0 max-w-[var(--w-read)] flex-col items-center gap-6 px-6 pt-[12vh] pb-[22vh]">
				<IconSliders className="text-ink-faint" size={64} strokeWidth={1.1} />

				<ModeToggle />

				<dl className="grid w-full max-w-[320px] grid-cols-[22px_minmax(0,1fr)] items-start gap-x-[10px] gap-y-2 text-meta tabular-nums">
					<Row
						icon={<IconGit {...GLYPH} />}
						label="commit"
						value={
							<code className="font-mono text-[11px] text-ink-muted">
								{shortCommit(status.data?.commit)}
							</code>
						}
					/>
					<Row
						icon={<IconSync {...GLYPH} />}
						label="同期日時"
						value={formatDateTime(status.data?.syncedAt)}
					/>
					<Row
						icon={<IconNote {...GLYPH} />}
						label="ノート数"
						value={status.data?.noteCount}
					/>
				</dl>
			</div>
		</div>
	);
}
