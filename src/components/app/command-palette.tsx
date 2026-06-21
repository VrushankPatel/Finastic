import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useUIStore } from "@/stores/ui";
import { usePlannerStore } from "@/stores/planner";
import { NAV } from "./nav";

export function CommandPalette() {
  const open = useUIStore((s) => s.paletteOpen);
  const setOpen = useUIStore((s) => s.setPaletteOpen);
  const setTheme = useUIStore((s) => s.setTheme);
  const theme = useUIStore((s) => s.theme);
  const setActive = usePlannerStore((s) => s.setActive);
  const scenarios = usePlannerStore((s) => s.scenarios);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 px-4 pt-[12vh] backdrop-blur-md"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--hairline)] bg-popover shadow-2xl"
      >
        <Command label="Command palette" className="flex flex-col">
          <Command.Input
            autoFocus
            placeholder="Jump to a page, switch scenario, toggle theme…"
            className="h-12 w-full border-b border-[var(--hairline)] bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing found.
            </Command.Empty>
            <Command.Group
              heading="Navigate"
              className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
            >
              {NAV.map((n) => (
                <Command.Item
                  key={n.to}
                  value={`nav ${n.label}`}
                  onSelect={() => {
                    navigate({ to: n.to });
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-accent"
                >
                  <n.icon className="h-4 w-4 text-muted-foreground" />
                  {n.label}
                </Command.Item>
              ))}
            </Command.Group>
            {scenarios.length > 0 && (
              <Command.Group
                heading="Scenarios"
                className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
              >
                {scenarios.map((s) => (
                  <Command.Item
                    key={s.id}
                    value={`scenario ${s.name}`}
                    onSelect={() => {
                      setActive(s.id);
                      setOpen(false);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-accent"
                  >
                    <span className="font-mono text-xs text-muted-foreground">●</span>
                    {s.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            <Command.Group
              heading="Actions"
              className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
            >
              <Command.Item
                value="theme toggle"
                onSelect={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-accent"
              >
                Toggle theme ({theme === "dark" ? "→ Light" : "→ Dark"})
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
