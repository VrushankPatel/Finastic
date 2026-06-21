import { useEffect, type ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { usePlannerStore } from "@/stores/planner";
import { useUIStore } from "@/stores/ui";
import { OnboardingGate } from "./onboarding";

export function AppShell({ children }: { children: ReactNode }) {
  const hydrate = usePlannerStore((s) => s.hydrate);
  const hydrated = usePlannerStore((s) => s.hydrated);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const accent = useUIStore((s) => s.accent);
  const setAccent = useUIStore((s) => s.setAccent);
  const currency = useUIStore((s) => s.currency);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  useEffect(() => {
    setAccent(accent);
  }, [accent, setAccent]);

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(60rem 40rem at 12% -10%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%), radial-gradient(50rem 36rem at 100% 0%, color-mix(in oklab, var(--sim) 18%, transparent), transparent 60%)",
        }}
      />
      <SidebarNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main key={currency} className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10">
          {hydrated ? <OnboardingGate>{children}</OnboardingGate> : <ShellSkeleton />}
        </main>
      </div>
      <BottomNav />
      <CommandPalette />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="h-8 w-48 animate-pulse rounded bg-surface" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
