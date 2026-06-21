import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { NAV } from "./nav";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo";

export function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups: { id: NonNullable<(typeof NAV)[number]["group"]>; label: string }[] = [
    { id: "plan", label: "Plan" },
    { id: "analyze", label: "Analyze" },
    { id: "system", label: "" },
  ];

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-[var(--hairline)] bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-3 pt-6">
        <LogoMark className="h-8 w-8 shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--primary)_60%,transparent)]" />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Finastic</div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Local · Private
          </div>
        </div>
      </div>

      <nav className="mt-2 flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((g) => {
          const items = NAV.filter((n) => n.group === g.id);
          return (
            <div key={g.id} className="mb-2">
              {g.label ? (
                <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {g.label}
                </div>
              ) : (
                <div className="my-2 h-px bg-[var(--hairline)]" />
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.to;
                  return (
                    <li key={item.to} className="relative">
                      {active && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-lg bg-sidebar-accent"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <Link
                        to={item.to}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="hidden font-mono text-[10px] text-muted-foreground xl:inline">
                            {item.shortcut}
                          </kbd>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="px-4 pb-4 pt-2 text-[10px] leading-relaxed text-muted-foreground">
        Designed & Built with ♥️ by Vrushank Patel
      </div>
    </aside>
  );
}
