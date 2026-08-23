import { useCallback } from "react";

import { useAppShell } from "@/components/shell";

/**
 * Closing the side panels after a navigation.
 *
 * Both panels are static columns on a wide screen and float above the note on a
 * narrow one. Only the floating form has to be dismissed when the reader picks
 * something out of it — on desktop the column stays where it is.
 */

/** Below this width the left panel is a drawer. Matches Tailwind `sm`. */
const PHONE = "(max-width: 639px)";
/** Below this width the right panel is an overlay. Matches Tailwind `lg`. */
const BELOW_DESKTOP = "(max-width: 1023px)";

function matches(query: string): boolean {
	try {
		return window.matchMedia(query).matches;
	} catch {
		return false;
	}
}

/** Closes the left drawer on phones; a no-op on tablet and desktop. */
export function useCloseLeftDrawer(): () => void {
	const { setLeftOpen } = useAppShell();
	return useCallback(() => {
		if (matches(PHONE)) {
			setLeftOpen(false);
		}
	}, [setLeftOpen]);
}

/** Closes the right overlay below desktop; a no-op on desktop. */
export function useCloseRightOverlay(): () => void {
	const { setRightOpen } = useAppShell();
	return useCallback(() => {
		if (matches(BELOW_DESKTOP)) {
			setRightOpen(false);
		}
	}, [setRightOpen]);
}
