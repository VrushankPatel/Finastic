import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function PendingSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-6 sm:px-6 lg:px-10">
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--surface)]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--surface)]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface)]" />
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent",
    defaultPendingComponent: PendingSkeleton,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
  });

  return router;
};
