import { createFileRoute } from "@tanstack/react-router";
import { usePlannerStore } from "@/stores/planner";
import { ASSET_META } from "@/lib/fi/defaults";
import { allocationStats, normalizeAllocation } from "@/lib/fi/portfolio";
import type { Allocation } from "@/lib/fi/types";
import { Slider } from "@/components/ui/slider";
import { Metric } from "@/components/app/metric";
import { percent } from "@/lib/fi/format";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio · Finastic" },
      { name: "description", content: "Asset allocation, expected return and volatility." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const scenario = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));
  const updateActive = usePlannerStore((s) => s.updateActive);
  if (!scenario) return null;
  const a = scenario.profile.allocation;
  const stats = allocationStats(a);
  const total = Object.values(a).reduce((s, v) => s + v, 0);

  const setAlloc = (k: keyof Allocation, v: number) =>
    updateActive((p) => ({ ...p, allocation: { ...p.allocation, [k]: Math.max(0, v) } }));

  const normalize = () =>
    updateActive((p) => ({ ...p, allocation: normalizeAllocation(p.allocation) }));

  const pieData = (Object.keys(a) as (keyof Allocation)[])
    .filter((k) => a[k] > 0)
    .map((k) => ({ name: ASSET_META[k].label, value: a[k], color: ASSET_META[k].color }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Portfolio</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Asset allocation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag to allocate. Expected return and volatility update live.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Metric label="Expected return" value={percent(stats.expectedReturn)} accent="success" />
        <Metric
          label="Volatility (σ)"
          value={percent(stats.volatility)}
          accent={stats.volatility > 0.18 ? "warning" : "info"}
        />
        <Metric
          label="Diversification"
          value={`${(stats.diversification * 100).toFixed(0)} / 100`}
          accent={stats.diversification > 0.7 ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,360px]">
        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <div className="text-base font-semibold">Weights</div>
              <div className="text-xs text-muted-foreground">
                Total: <span className="font-mono">{total.toFixed(0)}%</span>
              </div>
            </div>
            <button
              onClick={() => void normalize()}
              className="inline-flex h-8 min-h-11 items-center gap-1.5 rounded-lg hairline bg-surface px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Normalize to 100%
            </button>
          </div>
          <ul className="space-y-3">
            {(Object.keys(a) as (keyof Allocation)[]).map((k) => (
              <li key={k} className="flex items-center gap-4">
                <div className="flex w-32 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: ASSET_META[k].color }}
                  />
                  <span className="text-sm text-foreground">{ASSET_META[k].label}</span>
                </div>
                <Slider
                  value={[a[k]]}
                  min={0}
                  max={100}
                  step={0.5}
                  onValueChange={(v) => void setAlloc(k, v[0] ?? 0)}
                  className="flex-1"
                />
                <span className="w-14 text-right font-mono text-sm text-foreground tabular">
                  {a[k].toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="text-base font-semibold">Mix</div>
          <div className="text-xs text-muted-foreground">Live allocation</div>
          <div className="mt-2 h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={56}
                  outerRadius={92}
                  paddingAngle={2}
                  stroke="var(--background)"
                  strokeWidth={2}
                  isAnimationActive
                >
                  {pieData.map((p, i) => (
                    <Cell key={i} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
