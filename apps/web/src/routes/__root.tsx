import { Toaster } from "@Onyx/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
	AppShell,
	Header,
	LeftPanel,
	Rail,
	RightPanel,
	TabBar,
} from "@/components/shell";
import { ThemeProvider } from "@/components/theme-provider";
import type { orpc } from "@/utils/orpc";

import "../index.css";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
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

function RootComponent() {
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
					header={<Header />}
					left={<LeftPanel />}
					rail={<Rail active="notes" />}
					right={<RightPanel />}
					tabBar={<TabBar active="notes" />}
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
