import { Link, useRouterState } from "@tanstack/react-router";
import { useUIStore, ACCENTS, CURRENCIES, type AccentId, type CurrencyCode } from "@/stores/ui";
import { usePlannerStore } from "@/stores/planner";
import { Command, Moon, Sun, Plus, Palette } from "lucide-react";
import { NAV } from "./nav";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LogoMark } from "./logo";

function pageLabel(pathname: string) {
  return NAV.find((n) => n.to === pathname)?.label ?? "Dashboard";
}

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, setTheme, setPaletteOpen, accent, setAccent, currency, setCurrency } =
    useUIStore();
  const active = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));
  const scenarios = usePlannerStore((s) => s.scenarios);
  const setActive = usePlannerStore((s) => s.setActive);
  const newScenario = usePlannerStore((s) => s.newScenario);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--hairline)] bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <Link to="/" className="flex items-center gap-2 lg:hidden">
        <BrandMark />
        <span className="text-sm font-semibold">Finastic</span>
      </Link>
      <div className="hidden text-sm font-medium text-foreground lg:block">
        {pageLabel(pathname)}
      </div>
      <div className="hidden text-xs text-muted-foreground lg:block">·</div>
      {active && (
        <div className="hidden items-center gap-2 lg:flex">
          <select
            aria-label="Active scenario"
            value={active.id}
            onChange={(e) => setActive(e.target.value)}
            className="rounded-md bg-surface hairline px-2 py-1 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => newScenario()}
            className="inline-flex h-7 items-center gap-1 rounded-md hairline bg-surface px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label="New scenario"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        <select
          aria-label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          className="h-9 rounded-lg hairline bg-surface px-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
            <option key={c} value={c}>
              {CURRENCIES[c].symbol} {c}
            </option>
          ))}
        </select>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="inline-flex h-9 w-9 min-h-11 min-w-11 items-center justify-center rounded-lg hairline bg-surface text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Choose accent color"
            >
              <Palette className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 border-[var(--hairline)] bg-popover p-3">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Accent
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setAccent(id)}
                  aria-label={ACCENTS[id].label}
                  className={`group relative h-9 w-9 rounded-full ring-offset-2 ring-offset-popover transition ${accent === id ? "ring-2 ring-foreground" : "ring-1 ring-[var(--hairline)] hover:ring-foreground/40"}`}
                  style={{ background: ACCENTS[id].swatch }}
                />
              ))}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">{ACCENTS[accent].label}</div>
          </PopoverContent>
        </Popover>
        <button
          onClick={() => setPaletteOpen(true)}
          className="inline-flex h-9 min-w-11 items-center gap-2 rounded-lg hairline bg-surface px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Open command palette"
        >
          <Command className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search…</span>
          <kbd className="ml-2 hidden font-mono text-[10px] sm:inline">⌘K</kbd>
        </button>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="inline-flex h-9 w-9 min-h-11 min-w-11 items-center justify-center rounded-lg hairline bg-surface text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

function BrandMark() {
  return <LogoMark size={28} className="h-7 w-7" />;
}
