import { useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

const MAX_INDEX_KEY = "onyx.history.max";

/** TanStack stores the entry index on `history.state.__TSR_index`. */
function indexOf(state: unknown): number {
	if (state !== null && typeof state === "object" && "__TSR_index" in state) {
		const value = (state as { __TSR_index?: unknown }).__TSR_index;
		if (typeof value === "number") {
			return value;
		}
	}
	return 0;
}

function readMaxIndex(): number {
	try {
		const raw = window.sessionStorage.getItem(MAX_INDEX_KEY);
		const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);
		return Number.isNaN(parsed) ? 0 : parsed;
	} catch {
		return 0;
	}
}

function writeMaxIndex(value: number): void {
	try {
		window.sessionStorage.setItem(MAX_INDEX_KEY, String(value));
	} catch {
		/* private mode / storage disabled — forward stays disabled, no crash */
	}
}

export interface HistoryNav {
	canGoBack: boolean;
	canGoForward: boolean;
	back: () => void;
	forward: () => void;
}

/**
 * Header ← → state.
 *
 * `history.canGoBack()` is built in. There is no `canGoForward`, so the highest
 * entry index reached this session is tracked in `sessionStorage` (it survives
 * a reload, just like the browser's own forward stack) and reset on every
 * `PUSH`, which is exactly when the browser drops the forward entries.
 */
export function useHistoryNav(): HistoryNav {
	const router = useRouter();
	const [state, setState] = useState<{ back: boolean; forward: boolean }>({
		back: false,
		forward: false,
	});

	useEffect(() => {
		const history = router.history;

		const sync = (isPush: boolean) => {
			const index = indexOf(history.location.state);
			const max = isPush ? index : Math.max(readMaxIndex(), index);
			writeMaxIndex(max);
			setState({ back: history.canGoBack(), forward: index < max });
		};

		sync(false);
		return history.subscribe(({ action }) => sync(action.type === "PUSH"));
	}, [router]);

	const back = useCallback(() => router.history.back(), [router]);
	const forward = useCallback(() => router.history.forward(), [router]);

	return { back, canGoBack: state.back, canGoForward: state.forward, forward };
}
