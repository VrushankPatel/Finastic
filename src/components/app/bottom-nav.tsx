import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Lightbulb, LayoutDashboard, SlidersHorizontal, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/inputs", label: "Inputs", icon: SlidersHorizontal },
  { to: "/monte-carlo", label: "Sim", icon: Activity },
  { to: "/insights", label: "Ideas", icon: Lightbulb },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-screen-sm items-stretch justify-around border-t border-[var(--hairline)] bg-background/85 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
      aria-label="Primary"
    >
      {ITEMS.map((it) => {
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <it.icon className={cn("h-5 w-5", active && "text-success")} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
