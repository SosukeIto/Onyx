import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { IconNote, IconUnresolved } from "@/components/icons";

import { cx } from "./cx";
import { baseNameOf, folderOf, stripMd } from "./paths";

/**
 * Shared chrome for the list screens. `AppShell`'s `<main>` is
 * `overflow-hidden`, so every route owns its vertical scroll — that is what
 * `ScreenScroll` provides.
 */

/** One row of any list screen. Exported so routes can wrap it in their own link. */
export const ROW_CLASS =
	"flex min-w-0 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-line hover:bg-hover";

export function ScreenScroll({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className="onyx-scroll min-h-0 min-w-0 flex-1">
			<div
				className={cx(
					"mx-auto w-full min-w-0 max-w-[var(--w-read)] px-6 pt-5 pb-[22vh] max-sm:px-3 max-sm:pt-3",
					className,
				)}
			>
				{children}
			</div>
		</div>
	);
}

export interface RowProps {
	icon?: ReactNode;
	/** File / note name — one of the few places real text belongs. */
	title: string;
	/** Folder path under the title. */
	sub?: string;
	/** Right-aligned number or date. */
	meta?: ReactNode;
	/** Extra block under the title (search snippets). */
	children?: ReactNode;
}

export function RowContent({ icon, title, sub, meta, children }: RowProps) {
	return (
		<>
			<span className="flex-none text-ink-faint">
				{icon ?? <IconNote size={16} strokeWidth={1.6} />}
			</span>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="min-w-0 truncate font-medium text-ink text-ui">
					{title}
				</span>
				{sub ? (
					<span className="min-w-0 truncate text-ink-faint text-micro">
						{sub}
					</span>
				) : null}
				{children}
			</span>
			{meta === undefined ? null : (
				<span className="flex-none self-start pt-0.5 text-ink-muted text-micro tabular-nums">
					{meta}
				</span>
			)}
		</>
	);
}

export interface NoteRowProps extends Omit<RowProps, "title" | "sub"> {
	/** Vault path, with or without `.md`. */
	path: string;
	/** Defaults to the file name. */
	title?: string;
	/** Defaults to the folder path. */
	sub?: string;
}

/** One note in a list. Navigates with the same URL shape the renderer emits. */
export function NoteRow({ path, title, sub, ...rest }: NoteRowProps) {
	return (
		<Link
			className={ROW_CLASS}
			params={{ _splat: stripMd(path) }}
			title={path}
			to="/note/$"
		>
			<RowContent
				{...rest}
				sub={sub ?? folderOf(path)}
				title={title ?? baseNameOf(path)}
			/>
		</Link>
	);
}

/** A non-navigating row (unresolved targets have no note to open). */
export function StaticRow(props: RowProps) {
	return (
		<div
			className={cx(ROW_CLASS, "hover:border-transparent hover:bg-transparent")}
		>
			<RowContent {...props} />
		</div>
	);
}

/** Whole-screen placeholder: one glyph, no wording. */
export function EmptyScreen({
	icon,
	children,
}: {
	icon: ReactNode;
	children?: ReactNode;
}) {
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-ink-faint">
			{icon}
			{children}
		</div>
	);
}

/** 404 for a note: the dead-link glyph and the path that was asked for. */
export function MissingScreen({ path }: { path: string }) {
	return (
		<EmptyScreen icon={<IconUnresolved size={42} strokeWidth={1.3} />}>
			<span className="max-w-full text-center text-ink-muted text-ui [overflow-wrap:anywhere]">
				{path}
			</span>
		</EmptyScreen>
	);
}
