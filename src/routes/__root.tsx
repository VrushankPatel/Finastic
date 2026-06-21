import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportErrorEvent } from "../lib/error-reporting";
// @ts-expect-error - side-effect font import has no types
import "@fontsource-variable/inter";
// @ts-expect-error - side-effect font import has no types
import "@fontsource-variable/jetbrains-mono";
import { AppShell } from "../components/app/app-shell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportErrorEvent(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0e1219" },
      { title: "Finastic — Local-first financial independence planner" },
      {
        name: "description",
        content:
          "A premium Monte-Carlo retirement and FIRE planner that runs entirely in your browser. Your data never leaves your device.",
      },
      { name: "author", content: "Finastic" },
      { property: "og:title", content: "Finastic — Local-first financial independence planner" },
      {
        property: "og:description",
        content:
          "Monte Carlo, withdrawal strategies, risk decomposition, scenarios — fully offline and private.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@FinasticApp" },
      { name: "twitter:title", content: "Finastic — Local-first financial independence planner" },
      {
        name: "description",
        content:
          "Your FI Future is a local-first web app for comprehensive financial independence and retirement planning.",
      },
      {
        property: "og:description",
        content:
          "Your FI Future is a local-first web app for comprehensive financial independence and retirement planning.",
      },
      {
        name: "twitter:description",
        content:
          "Your FI Future is a local-first web app for comprehensive financial independence and retirement planning.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/75e1a8eb-c027-4778-87fa-bd9b3dca7bbb/id-preview-e050ec0f--5a5e23bc-f33d-40f2-a98e-c00334e5f1a6.finastic-1781846321627.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/75e1a8eb-c027-4778-87fa-bd9b3dca7bbb/id-preview-e050ec0f--5a5e23bc-f33d-40f2-a98e-c00334e5f1a6.finastic-1781846321627.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  );
}
