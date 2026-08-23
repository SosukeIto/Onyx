import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
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
import { useActiveHeading } from "@/hooks/use-active-heading";
import { useActiveNote } from "@/hooks/use-active-note";
import { useHistoryNav } from "@/hooks/use-history-nav";
import { useCloseLeftDrawer, useCloseRightOverlay } from "@/hooks/use-panel-dismiss";
import { errorText } from "@/lib/errors";
import { EmptyScreen } from "@/lib/list";
import {
  LeftPanelSlotHost,
  PanelSlotsProvider,
  RightPanelSlotHost,
  useRightPanelClaimed,
} from "@/lib/panel-slots";
import { formatDateTime, navKeyFor, shortCommit, stripMd } from "@/lib/paths";
import { statusOptions, treeOptions } from "@/lib/queries";
import { fetchSession } from "@/server/session";

/** Where each rail / tab-bar item goes. */
const NAV_TO = {
  daily: "/daily",
  graph: "/graph",
  logs: "/logs",
  notes: "/",
  search: "/search",
  settings: "/settings",
} as const satisfies Record<NavKey, string>;

/**
 * The reading shell, and the session gate in front of it.
 *
 * Everything the reader can see hangs off this pathless layout route, so the
 * rail, the panels and the header are mounted once for the whole app while the
 * URLs stay exactly what they were (`/`, `/note/…`, `/daily/…`, …).
 *
 * The redirect below is a UX guard only — the data boundary is the
 * `authMiddleware` on every server function (src/server/middleware.ts) and the
 * session check on the `/vault/*` and `/files/*` routes.
 */
export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const session = await fetchSession();
    if (!session) throw redirect({ to: "/login" });
    return { session };
  },
  loader: ({ context }) => context.session,
  component: AppLayout,
  errorComponent: ShellErrorScreen,
  notFoundComponent: ShellNotFoundScreen,
});

function useNavKey(): NavKey {
  return useRouterState({
    select: (state) => navKeyFor(state.location.pathname),
  });
}

/** Rail / tab-bar items become router links so navigation stays client side. */
function renderNavItem({ active, className, icon, label, navKey }: NavRenderArgs) {
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
      // There is no git sync any more: the bundle is baked at build time, so
      // what the dot reports is which commit of the vault this deploy carries.
      sync={{
        commit: shortCommit(status.data?.commit),
        error: null,
        syncedAt: formatDateTime(status.data?.builtAt),
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
        document.getElementById(slug)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        document.querySelector<HTMLInputElement>("input[data-onyx-search]")?.focus();
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);
}

/** Anything a route boundary below did not catch, drawn inside the shell. */
function ShellErrorScreen({ error }: ErrorComponentProps) {
  return (
    <EmptyScreen icon={<IconUnresolved size={42} strokeWidth={1.3} />}>
      <span className="max-w-full text-center text-ink-muted text-ui [overflow-wrap:anywhere]">
        {errorText(error)}
      </span>
    </EmptyScreen>
  );
}

/** Shared 404 — it renders inside the shell, so the reader can navigate away. */
function ShellNotFoundScreen() {
  return <EmptyScreen icon={<IconUnresolved size={42} strokeWidth={1.3} />} />;
}

function AppLayout() {
  useSearchShortcut();

  return (
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
  );
}
