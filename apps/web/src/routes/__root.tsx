import { Toaster } from "@Onyx/ui/components/sonner";
import { type QueryClient, useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	HeadContent,
	Link,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect, useMemo } from "react";

import { IconUnresolved } from "@/components/icons";
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
} from "@/components/shell";
import { ThemeProvider } from "@/components/theme-provider";
import { useActiveHeading } from "@/hooks/use-active-heading";
import { useActiveNote } from "@/hooks/use-active-note";
import { useHistoryNav } from "@/hooks/use-history-nav";
import {
	useCloseLeftDrawer,
	useCloseRightOverlay,
} from "@/hooks/use-panel-dismiss";
import { EmptyScreen } from "@/lib/list";
import {
	LeftPanelSlotHost,
	PanelSlotsProvider,
	RightPanelSlotHost,
	useRightPanelClaimed,
} from "@/lib/panel-slots";
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
	logs: "/logs",
	notes: "/",
	search: "/search",
	settings: "/settings",
} as const satisfies Record<NavKey, string>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	errorComponent: RootErrorScreen,
	notFoundComponent: RootNotFoundScreen,
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
	// The panel is a drawer on the phone — opening something has to close it.
	const closeDrawer = useCloseLeftDrawer();
	const tree = useQuery(treeOptions());
	const status = useQuery(statusOptions());
	const { path } = useActiveNote();

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
			onSettings={() => {
				closeDrawer();
				void navigate({ to: "/settings" });
			}}
			tree={tree.data}
		>
			{/* Calendar (/daily), facets (/search), graph controls (/graph). */}
			<LeftPanelSlotHost />
		</LeftPanel>
	);
}

/** Outline / backlinks / file facts of the note the shell is showing. */
function NoteRightPanel() {
	const navigate = useNavigate();
	const closeOverlay = useCloseRightOverlay();
	const status = useQuery(statusOptions());
	const { detail } = useActiveNote();
	const activeSlug = useActiveHeading(detail?.headings);

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
			onOpenGraph={() => {
				closeOverlay();
				void navigate({ search: { center: detail.path }, to: "/graph" });
			}}
			onUnresolvedSelect={() => {
				closeOverlay();
				void navigate({ to: "/unresolved" });
			}}
			unresolved={detail.unresolvedTargets}
		/>
	);
}

/** A route may take the panel over (the graph screen shows its selection). */
function AppRightPanel() {
	const claimed = useRightPanelClaimed();

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col">
			<RightPanelSlotHost />
			{claimed ? null : <NoteRightPanel />}
		</div>
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

/** Anything the route boundaries below did not catch. One glyph, one line. */
function RootErrorScreen({ error }: ErrorComponentProps) {
	return (
		<div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-app px-6 text-ink-faint">
			<IconUnresolved size={42} strokeWidth={1.3} />
			<span className="max-w-full text-center text-ink-muted text-ui [overflow-wrap:anywhere]">
				{error.message}
			</span>
		</div>
	);
}

/** Shared 404 — it renders inside the shell, so the reader can navigate away. */
function RootNotFoundScreen() {
	return <EmptyScreen icon={<IconUnresolved size={42} strokeWidth={1.3} />} />;
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
				<PanelSlotsProvider>
					<AppShell
						header={<AppHeader />}
						left={<AppLeftPanel />}
						rail={<AppRail />}
						right={<AppRightPanel />}
						tabBar={<AppTabBar />}
					>
						<Outlet />
					</AppShell>
				</PanelSlotsProvider>
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</>
	);
}
