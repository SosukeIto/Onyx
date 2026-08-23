import { Toaster } from "@Onyx/ui/components/sonner";
import { type QueryClient, useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useCallback, useEffect, useMemo } from "react";

import {
	AppShell,
	type BreadcrumbSegment,
	Header,
	LeftPanel,
	type NavKey,
	type NavRenderArgs,
	Rail,
	RightPanel,
	TabBar,
	useAppShell,
} from "@/components/shell";
import { ThemeProvider } from "@/components/theme-provider";
import { useActiveHeading } from "@/hooks/use-active-heading";
import { useActiveNote } from "@/hooks/use-active-note";
import { useHistoryNav } from "@/hooks/use-history-nav";
import { formatDateTime, navKeyFor, shortCommit, stripMd } from "@/lib/paths";
import { statusOptions, treeOptions } from "@/lib/queries";
import type { orpc } from "@/utils/orpc";

import "../index.css";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

/** Where each rail / tab-bar item goes. */
const NAV_TO = {
	daily: "/daily",
	graph: "/graph",
	notes: "/",
	search: "/search",
	settings: "/settings",
} as const satisfies Record<NavKey, string>;

const PHONE = "(max-width: 639px)";
const BELOW_DESKTOP = "(max-width: 1023px)";

function matches(query: string): boolean {
	try {
		return window.matchMedia(query).matches;
	} catch {
		return false;
	}
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "Onyx",
			},
			{
				name: "description",
				content: "Obsidian vault (SosukeIto/my-vault) の Web ビューア",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function useNavKey(): NavKey {
	return useRouterState({
		select: (state) => navKeyFor(state.location.pathname),
	});
}

/** Rail / tab-bar items become router links so navigation stays client side. */
function renderNavItem({
	active,
	className,
	icon,
	label,
	navKey,
}: NavRenderArgs) {
	return (
		<Link
			aria-current={active ? "page" : undefined}
			aria-label={label}
			className={className}
			to={NAV_TO[navKey]}
		>
			{icon}
		</Link>
	);
}

function AppRail() {
	return <Rail active={useNavKey()} renderItem={renderNavItem} />;
}

function AppTabBar() {
	return <TabBar active={useNavKey()} renderItem={renderNavItem} />;
}

/** `01_Note/03_考え方/foo.md` → three crumbs; only the last one is the file. */
function toSegments(path: string): BreadcrumbSegment[] {
	const parts = path.split("/").filter(Boolean);
	return parts.map((part, index) => ({
		label: index === parts.length - 1 ? stripMd(part) : part,
	}));
}

function AppHeader() {
	const navigate = useNavigate();
	const history = useHistoryNav();
	const status = useQuery(statusOptions());
	const { path } = useActiveNote();

	const segments = useMemo(() => (path ? toSegments(path) : []), [path]);

	return (
		<Header
			canGoBack={history.canGoBack}
			canGoForward={history.canGoForward}
			onBack={history.back}
			onForward={history.forward}
			onLogoClick={() => {
				void navigate({ to: "/" });
			}}
			segments={segments}
			sync={{
				commit: shortCommit(status.data?.commit),
				error: status.data?.lastError ?? null,
				syncedAt: formatDateTime(status.data?.syncedAt),
				syncing: status.isFetching,
			}}
		/>
	);
}

function AppLeftPanel() {
	const navigate = useNavigate();
	const { setLeftOpen } = useAppShell();
	const tree = useQuery(treeOptions());
	const status = useQuery(statusOptions());
	const { path } = useActiveNote();

	// The panel is a drawer on the phone — opening something has to close it.
	const closeDrawer = useCallback(() => {
		if (matches(PHONE)) {
			setLeftOpen(false);
		}
	}, [setLeftOpen]);

	return (
		<LeftPanel
			activePath={path}
			noteCount={status.data?.noteCount}
			onOpen={(target) => {
				closeDrawer();
				void navigate({ params: { _splat: stripMd(target) }, to: "/note/$" });
			}}
			onSearch={() => {
				closeDrawer();
				void navigate({ to: "/search" });
			}}
			tree={tree.data}
		/>
	);
}

function AppRightPanel() {
	const navigate = useNavigate();
	const { setRightOpen } = useAppShell();
	const status = useQuery(statusOptions());
	const { detail } = useActiveNote();
	const activeSlug = useActiveHeading(detail?.headings);

	const closeOverlay = useCallback(() => {
		if (matches(BELOW_DESKTOP)) {
			setRightOpen(false);
		}
	}, [setRightOpen]);

	if (!detail) {
		return <RightPanel />;
	}

	return (
		<RightPanel
			activeSlug={activeSlug}
			backlinks={detail.backlinks}
			headings={detail.headings}
			info={{
				commit: shortCommit(status.data?.commit),
				linkCount: detail.links.length,
				modified: formatDateTime(detail.modified),
				path: detail.path,
				size: detail.size,
				unresolvedCount: detail.unresolvedTargets.length,
			}}
			onBacklinkSelect={(from) => {
				closeOverlay();
				void navigate({ params: { _splat: stripMd(from) }, to: "/note/$" });
			}}
			onHeadingSelect={(slug) => {
				document
					.getElementById(slug)
					?.scrollIntoView({ behavior: "smooth", block: "start" });
			}}
			onUnresolvedSelect={() => {
				closeOverlay();
				void navigate({ to: "/unresolved" });
			}}
			unresolved={detail.unresolvedTargets}
		/>
	);
}

/** ⌘K / Ctrl+K opens the search screen and puts the caret in the field. */
function useSearchShortcut() {
	const navigate = useNavigate();

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key.toLowerCase() !== "k" || event.altKey || event.shiftKey) {
				return;
			}
			if (!event.metaKey && !event.ctrlKey) {
				return;
			}
			event.preventDefault();
			void navigate({ to: "/search" }).then(() => {
				document
					.querySelector<HTMLInputElement>("input[data-onyx-search]")
					?.focus();
			});
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [navigate]);
}

function RootComponent() {
	useSearchShortcut();

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				disableTransitionOnChange
				enableSystem
				storageKey="onyx-theme"
			>
				<AppShell
					header={<AppHeader />}
					left={<AppLeftPanel />}
					rail={<AppRail />}
					right={<AppRightPanel />}
					tabBar={<AppTabBar />}
				>
					<Outlet />
				</AppShell>
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</>
	);
}
