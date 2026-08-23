import type { TreeFolder, TreeNode } from "@Onyx/vault";
import { type Ref, useCallback, useEffect, useRef, useState } from "react";

import { IconChevron, IconFolder, IconNote } from "@/components/icons";
import { cx } from "@/lib/cx";

export interface FileTreeProps {
	/** Folder tree from the vault index. Nothing renders while it is missing. */
	tree?: TreeFolder;
	/** Vault path of the open note. Its ancestors auto-expand. */
	activePath?: string;
	onOpen?: (path: string) => void;
	/** Folder paths expanded on first render, on top of `activePath`'s ancestors. */
	defaultOpen?: readonly string[];
	/** Scroll the active row into view when it changes. On by default. */
	revealActive?: boolean;
	className?: string;
}

const ROW =
	"flex h-[27px] w-full min-w-0 items-center gap-[5px] rounded-md pr-1.5 text-left text-ink-muted text-ui transition-colors hover:bg-hover hover:text-ink max-sm:h-[34px]";

/** `01_Note/03_考え方/x.md` → `["01_Note", "01_Note/03_考え方"]` */
function ancestorsOf(path: string): string[] {
	const parts = path.split("/");
	parts.pop();
	const out: string[] = [];
	let prefix = "";
	for (const part of parts) {
		prefix = prefix ? `${prefix}/${part}` : part;
		out.push(prefix);
	}
	return out;
}

function indent(depth: number) {
	return { paddingLeft: `${4 + depth * 13}px` };
}

interface NodeProps {
	node: TreeNode;
	depth: number;
	activePath?: string;
	expanded: Set<string>;
	onToggle: (path: string) => void;
	onOpen?: (path: string) => void;
	/** Attached to the active file row so the tree can scroll it into view. */
	activeRef?: Ref<HTMLButtonElement>;
}

function Node({
	node,
	depth,
	activePath,
	expanded,
	onToggle,
	onOpen,
	activeRef,
}: NodeProps) {
	if (node.kind === "file") {
		const active = node.path === activePath;
		return (
			<button
				aria-current={active ? "page" : undefined}
				className={cx(
					ROW,
					active && "bg-brand-soft font-medium text-brand hover:bg-brand-soft",
				)}
				onClick={() => onOpen?.(node.path)}
				ref={active ? activeRef : undefined}
				style={indent(depth)}
				title={node.path}
				type="button"
			>
				<span aria-hidden="true" className="w-[14px] flex-none" />
				<IconNote
					className={cx("flex-none", active ? "text-brand" : "text-ink-faint")}
					size={15}
					strokeWidth={1.6}
				/>
				<span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
					{node.name}
				</span>
			</button>
		);
	}

	const open = expanded.has(node.path);
	return (
		<>
			<button
				aria-expanded={open}
				className={cx(ROW, "font-medium text-ink")}
				onClick={() => onToggle(node.path)}
				style={indent(depth)}
				title={node.path}
				type="button"
			>
				<IconChevron
					className={cx(
						"flex-none text-ink-faint transition-transform duration-150",
						open && "rotate-90",
					)}
					size={14}
					strokeWidth={1.6}
				/>
				<IconFolder
					className="flex-none text-ink-faint"
					size={15}
					strokeWidth={1.6}
				/>
				<span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
					{node.name}
				</span>
				{node.noteCount > 0 ? (
					<span className="flex-none text-[10.5px] text-ink-muted tabular-nums">
						{node.noteCount}
					</span>
				) : null}
			</button>
			{/* A collapsed folder renders no rows at all — with ~250 notes in the
			    vault only the open branches ever reach the DOM. */}
			{open
				? node.children.map((child) => (
						<Node
							activePath={activePath}
							activeRef={activeRef}
							depth={depth + 1}
							expanded={expanded}
							key={child.path}
							node={child}
							onOpen={onOpen}
							onToggle={onToggle}
						/>
					))
				: null}
		</>
	);
}

/**
 * Vault file tree. Long Japanese names truncate with an ellipsis and keep the
 * full vault path in `title`; folders show their note count on the right.
 */
export function FileTree({
	tree,
	activePath,
	onOpen,
	defaultOpen,
	revealActive = true,
	className,
}: FileTreeProps) {
	const [expanded, setExpanded] = useState<Set<string>>(
		() => new Set(defaultOpen ?? []),
	);
	const activeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!activePath) {
			return;
		}
		setExpanded((prev) => {
			const next = new Set(prev);
			let changed = false;
			for (const folder of ancestorsOf(activePath)) {
				if (!next.has(folder)) {
					next.add(folder);
					changed = true;
				}
			}
			return changed ? next : prev;
		});
	}, [activePath]);

	// `nearest` never moves the panel when the row is already visible.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `expanded` is the trigger, not a value — the active row only mounts once the effect above has opened its ancestors
	useEffect(() => {
		if (!revealActive || !activePath) {
			return;
		}
		activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
	}, [activePath, expanded, revealActive]);

	const onToggle = useCallback((path: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (!next.delete(path)) {
				next.add(path);
			}
			return next;
		});
	}, []);

	if (!tree) {
		return null;
	}

	return (
		<div className={cx("min-w-0 px-1 pt-0.5 pb-8", className)}>
			{tree.children.map((child) => (
				<Node
					activePath={activePath}
					activeRef={activeRef}
					depth={0}
					expanded={expanded}
					key={child.path}
					node={child}
					onOpen={onOpen}
					onToggle={onToggle}
				/>
			))}
		</div>
	);
}
