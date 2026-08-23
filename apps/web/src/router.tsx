import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { toast } from "sonner";

import Loader from "./components/loader";
import { errorText, isNotFoundError } from "./lib/errors";
import { routeTree } from "./routeTree.gen";

/**
 * One router per request on the server, one for the tab on the client.
 *
 * The QueryClient is built here rather than in a module singleton so a Worker
 * isolate serving two requests never shares one reader's cache with another.
 * `setupRouterSsrQueryIntegration` dehydrates whatever the loaders put in that
 * cache into the SSR payload and rehydrates it on the client, which is what
 * keeps the first client render identical to the server's.
 */
export function getRouter() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // The route's notFound UI already covers a missing note; no toast.
        // (And nothing is worth toasting while rendering on the server.)
        if (typeof window === "undefined" || isNotFoundError(error)) return;
        toast.error(errorText(error), {
          action: {
            label: "retry",
            onClick: () => {
              query.invalidate();
            },
          },
        });
      },
    }),
  });

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: () => <Loader />,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
