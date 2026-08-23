import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { createPortal } from "react-dom";

import { cx } from "./cx";

/**
 * Per-route content for the shell's side panels.
 *
 * `__root` owns `LeftPanel` / `RightPanel` for every screen, but the calendar,
 * the search facets and the graph controls belong to one route each — and they
 * share state with that route's main column (the graph filters drive both the
 * controls and the canvas). So the route *builds* the element and this module
 * *renders* it into a host node inside the panel.
 *
 * A portal is what makes that safe: the node keeps the route component as its
 * React parent (state, context and query cache all stay put) while living in
 * the panel's DOM. Registering the node in an effect instead would re-enter
 * `setState` on every render, because a JSX element is a new object each time.
 */

interface PanelSlotsValue {
	leftHost: HTMLElement | null;
	rightHost: HTMLElement | null;
	setLeftHost: (node: HTMLDivElement | null) => void;
	setRightHost: (node: HTMLDivElement | null) => void;
	/** True while any route occupies the right panel. */
	rightClaimed: boolean;
	/** Claims the right panel; call the returned function to release it. */
	claimRight: () => () => void;
}

const PanelSlotsContext = createContext<PanelSlotsValue | null>(null);

function usePanelSlots(): PanelSlotsValue | null {
	return useContext(PanelSlotsContext);
}

export function PanelSlotsProvider({ children }: { children: ReactNode }) {
	// Plain `useState` setters — they are referentially stable, so they can be
	// used as ref callbacks without detaching the ref on every render.
	const [leftHost, setLeftHost] = useState<HTMLDivElement | null>(null);
	const [rightHost, setRightHost] = useState<HTMLDivElement | null>(null);
	const [rightClaims, setRightClaims] = useState(0);

	const claimRight = useCallback(() => {
		setRightClaims((count) => count + 1);
		return () => setRightClaims((count) => count - 1);
	}, []);

	const value = useMemo<PanelSlotsValue>(
		() => ({
			claimRight,
			leftHost,
			rightClaimed: rightClaims > 0,
			rightHost,
			setLeftHost,
			setRightHost,
		}),
		[claimRight, leftHost, rightClaims, rightHost],
	);

	return (
		<PanelSlotsContext.Provider value={value}>
			{children}
		</PanelSlotsContext.Provider>
	);
}

/**
 * Where `useLeftPanelSlot` renders. Goes into `LeftPanel`'s `children` slot,
 * above the file tree. `empty:hidden` keeps it out of the layout on the routes
 * that put nothing there.
 */
export function LeftPanelSlotHost({ className }: { className?: string }) {
	const slots = usePanelSlots();
	return (
		<div
			className={cx(
				"onyx-scroll min-h-0 min-w-0 shrink empty:hidden",
				className,
			)}
			ref={slots?.setLeftHost}
		/>
	);
}

/** Where `useRightPanelSlot` renders. Fills the panel only while claimed. */
export function RightPanelSlotHost({ className }: { className?: string }) {
	const slots = usePanelSlots();
	return (
		<div
			className={cx(
				"min-h-0 min-w-0 empty:hidden",
				slots?.rightClaimed && "onyx-scroll flex flex-1 flex-col pb-6",
				className,
			)}
			ref={slots?.setRightHost}
		/>
	);
}

/** True while a route is rendering into the right panel. */
export function useRightPanelClaimed(): boolean {
	return usePanelSlots()?.rightClaimed ?? false;
}

function isPresent(node: ReactNode): boolean {
	return node !== null && node !== undefined && node !== false;
}

/**
 * Render `node` in the left panel, above the file tree.
 *
 * Returns the portal — the route has to include it in its own output, which is
 * what keeps the node mounted for exactly as long as the route is.
 */
export function useLeftPanelSlot(node: ReactNode): ReactNode {
	const host = usePanelSlots()?.leftHost ?? null;
	if (!host || !isPresent(node)) {
		return null;
	}
	return createPortal(node, host);
}

/**
 * Render `node` in the right panel *instead of* the outline / backlinks column.
 * Passing `null` releases the panel, so a route can hand it back (the graph
 * screen does, whenever no node is selected).
 */
export function useRightPanelSlot(node: ReactNode): ReactNode {
	const slots = usePanelSlots();
	const claimRight = slots?.claimRight;
	const used = isPresent(node);

	useEffect(() => {
		if (!used || !claimRight) {
			return;
		}
		return claimRight();
	}, [claimRight, used]);

	const host = slots?.rightHost ?? null;
	if (!host || !used) {
		return null;
	}
	return createPortal(node, host);
}
