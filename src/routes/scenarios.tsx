import { createFileRoute } from "@tanstack/react-router";
import { usePlannerStore } from "@/stores/planner";
import { project } from "@/lib/fi/projection";
import { fiScore } from "@/lib/fi/fire";
import { currency } from "@/lib/fi/format";
import { motion } from "framer-motion";
import { Copy, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Scenarios · Finastic" },
      { name: "description", content: "Compare and manage multiple FI plans side-by-side." },
    ],
  }),
  component: ScenariosPage,
});

const COMPARE_COLORS = [
  "var(--color-success)",
  "var(--color-info)",
  "var(--color-sim)",
  "var(--color-warning)",
];

function ScenariosPage() {
  const scenarios = usePlannerStore((s) => s.scenarios);
  const activeId = usePlannerStore((s) => s.activeId);
  const setActive = usePlannerStore((s) => s.setActive);
  const newScenario = usePlannerStore((s) => s.newScenario);
  const duplicateScenario = usePlannerStore((s) => s.duplicateScenario);
  const deleteScenarioById = usePlannerStore((s) => s.deleteScenarioById);
  const togglePin = usePlannerStore((s) => s.togglePin);
  const renameScenario = usePlannerStore((s) => s.renameScenario);
  const [selected, setSelected] = useState<string[]>([]);

  const sorted = [...scenarios].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt,
  );

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id],
    );
  }

  const compareData = useMemo(() => {
    if (selected.length < 2) return null;
    const projs = selected
      .map((id) => {
        const sc = scenarios.find((x) => x.id === id);
        return sc ? { name: sc.name, rows: project(sc.profile).rows } : null;
      })
      .filter(Boolean) as { name: string; rows: ReturnType<typeof project>["rows"] }[];
    const maxLen = Math.max(...projs.map((p) => p.rows.length));
    const baseAge = Math.min(...projs.map((p) => p.rows[0]?.age ?? 0));
    return Array.from({ length: maxLen }).map((_, i) => {
      const point: Record<string, number> = { age: baseAge + i };
      projs.forEach((p) => {
        const row = p.rows[i];
        if (row) point[p.name] = Math.round(row.endBalance);
      });
      return point;
    });
  }, [selected, scenarios]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Scenarios</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Plans & comparisons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pin your favorites. Tick up to 4 to overlay net-worth projections.
          </p>
        </div>
        <button
          onClick={() => void newScenario()}
          className="inline-flex h-10 min-h-11 items-center gap-2 rounded-xl bg-success px-4 text-sm font-medium text-success-foreground shadow-lg shadow-success/10"
        >
          <Plus className="h-4 w-4" /> New scenario
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((s, i) => {
          const proj = project(s.profile);
          const score = fiScore(s.profile);
          const isActive = s.id === activeId;
          const isSelected = selected.includes(s.id);
          return (
            <motion.article
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
              className={`flex flex-col gap-3 rounded-3xl hairline bg-surface p-5 ring-soft transition-colors ${
                isActive ? "border-success/40" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  defaultValue={s.name}
                  onBlur={(e) => void renameScenario(s.id, e.target.value || s.name)}
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold text-foreground outline-none"
                />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button
                    onClick={() => void togglePin(s.id)}
                    aria-label="Pin"
                    className="rounded p-1 hover:text-foreground"
                  >
                    {s.pinned ? (
                      <Pin className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <PinOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => void duplicateScenario(s.id)}
                    aria-label="Duplicate"
                    className="rounded p-1 hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void deleteScenarioById(s.id)}
                    aria-label="Delete"
                    className="rounded p-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface-2 p-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    FI Score
                  </div>
                  <div className="font-mono text-sm text-foreground">{Math.round(score)}</div>
                </div>
                <div className="rounded-lg bg-surface-2 p-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    FI Age
                  </div>
                  <div className="font-mono text-sm text-foreground">{proj.fiAge ?? "—"}</div>
                </div>
                <div className="rounded-lg bg-surface-2 p-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Target
                  </div>
                  <div className="font-mono text-sm text-foreground">
                    {currency(proj.fiTarget, { compact: true })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActive(s.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium ${
                    isActive
                      ? "bg-success text-success-foreground"
                      : "hairline bg-surface-2 text-foreground hover:bg-accent"
                  }`}
                >
                  {isActive ? "Active" : "Make active"}
                </button>
                <label className="flex items-center gap-1 rounded-lg hairline bg-surface-2 px-2 py-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(s.id)}
                    className="accent-info"
                  />
                  Compare
                </label>
              </div>
            </motion.article>
          );
        })}
      </section>

      {compareData && (
        <section className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="text-base font-semibold">Comparison</div>
          <div className="text-xs text-muted-foreground">{selected.length} scenarios overlaid</div>
          <div className="mt-4 h-80">
            <ResponsiveContainer>
              <LineChart data={compareData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <XAxis
                  dataKey="age"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => currency(Number(v), { compact: true })}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => currency(v, { compact: true })}
                  labelFormatter={(l) => `Age ${l}`}
                />
                {selected.map((id, i) => {
                  const sc = scenarios.find((x) => x.id === id);
                  if (!sc) return null;
                  return (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={sc.name}
                      stroke={COMPARE_COLORS[i % COMPARE_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
