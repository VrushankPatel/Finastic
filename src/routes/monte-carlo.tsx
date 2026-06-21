import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePlannerStore } from "@/stores/planner";
import { runMonteCarlo } from "@/lib/workers/montecarlo-client";
import type { MCRequest, MCResult } from "@/lib/workers/montecarlo.worker";
import { Metric } from "@/components/app/metric";
import { currency, percent } from "@/lib/fi/format";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Play, Zap } from "lucide-react";

export const Route = createFileRoute("/monte-carlo")({
  head: () => ({
    meta: [
      { title: "Monte Carlo · Finastic" },
      { name: "description", content: "Run thousands of simulations of your retirement plan." },
    ],
  }),
  component: MCPage,
});

type ShockId = NonNullable<MCRequest["shock"]>;

const SHOCKS: { id: ShockId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "dotcom2000", label: "2000 Dotcom" },
  { id: "gfc2008", label: "2008 GFC" },
  { id: "stagflation70s", label: "70s Stagflation" },
  { id: "lostDecade", label: "Lost Decade" },
];

function MCPage() {
  const scenario = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));
  const [paths, setPaths] = useState(2000);
  const [shock, setShock] = useState<ShockId>("none");
  const [fatTails, setFatTails] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MCResult | null>(null);

  if (!scenario) return null;

  async function run() {
    if (!scenario) return;
    setRunning(true);
    setProgress(0);
    try {
      const r = await runMonteCarlo(
        {
          profile: scenario.profile,
          paths,
          shock,
          fatTails,
          seed: Date.now() % 2 ** 31,
        },
        (done, total) => setProgress(done / total),
      );
      setResult(r);
    } finally {
      setRunning(false);
      setProgress(1);
    }
  }

  const chartData = result
    ? result.ageAxis.map((age, i) => ({
        age,
        p10: Math.round(result.p10[i]),
        p25: Math.round(result.p25[i]),
        p50: Math.round(result.p50[i]),
        p75: Math.round(result.p75[i]),
        p90: Math.round(result.p90[i]),
        band10_90: [Math.round(result.p10[i]), Math.round(result.p90[i])] as [number, number],
        band25_75: [Math.round(result.p25[i]), Math.round(result.p75[i])] as [number, number],
      }))
    : [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Monte Carlo
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Probability of success</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each path randomizes returns. Median is just one outcome — the full distribution is what
            matters.
          </p>
        </div>
      </header>

      <section className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Paths
            </div>
            <div className="mt-2 inline-flex overflow-hidden rounded-xl hairline bg-surface-2">
              {[1000, 2000, 5000, 10000].map((n) => (
                <button
                  key={n}
                  onClick={() => setPaths(n)}
                  className={`px-3 py-2 text-xs ${
                    paths === n
                      ? "bg-success/15 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Stress preset
            </div>
            <div className="mt-2 inline-flex overflow-hidden rounded-xl hairline bg-surface-2">
              {SHOCKS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShock(s.id)}
                  className={`px-3 py-2 text-xs ${
                    shock === s.id
                      ? "bg-info/15 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl hairline bg-surface-2 px-3 text-xs text-foreground">
            <input
              type="checkbox"
              checked={fatTails}
              onChange={(e) => setFatTails(e.target.checked)}
              className="h-3.5 w-3.5 accent-success"
            />
            Fat tails (Student-t mixture)
          </label>

          <button
            onClick={() => void run()}
            disabled={running}
            className="ml-auto inline-flex h-10 min-h-11 items-center gap-2 rounded-xl bg-success px-4 text-sm font-medium text-success-foreground shadow-lg shadow-success/10 transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {running ? <Zap className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}
            {running ? `Simulating… ${Math.round(progress * 100)}%` : "Run simulation"}
          </button>
        </div>

        {running && (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full bg-success"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}
      </section>

      {result && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Success probability"
              value={percent(result.successRate, 1)}
              accent={
                result.successRate > 0.85
                  ? "success"
                  : result.successRate > 0.65
                    ? "info"
                    : "warning"
              }
              hint={`${result.paths.toLocaleString()} paths`}
            />
            <Metric
              label="Median terminal"
              value={currency(result.medianTerminal, { compact: true })}
              accent="info"
            />
            <Metric
              label="10th percentile"
              value={currency(result.p10[result.p10.length - 1] ?? 0, { compact: true })}
              accent="warning"
              hint="Bad outcomes"
            />
            <Metric
              label="90th percentile"
              value={currency(result.p90[result.p90.length - 1] ?? 0, { compact: true })}
              accent="success"
              hint="Best outcomes"
            />
          </section>

          <section className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
            <div className="text-base font-semibold">Fan chart — net worth by age</div>
            <div className="text-xs text-muted-foreground">
              Bands: 10–90 (light), 25–75 (dark). Line = median.
            </div>
            <div className="mt-4 h-80">
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--hairline)" vertical={false} />
                  <XAxis
                    dataKey="age"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => currency(Number(v), { compact: true })}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
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
                    formatter={(value: unknown) => {
                      if (Array.isArray(value)) {
                        const [low, high] = value.map(Number);
                        return `${currency(low, { compact: true })} - ${currency(high, { compact: true })}`;
                      }
                      return currency(Number(value), { compact: true });
                    }}
                    labelFormatter={(l) => `Age ${l}`}
                  />
                  <Area
                    dataKey="band10_90"
                    stroke="none"
                    fill="var(--color-sim)"
                    fillOpacity={0.15}
                    isAnimationActive
                  />
                  <Area
                    dataKey="band25_75"
                    stroke="none"
                    fill="var(--color-sim)"
                    fillOpacity={0.3}
                    isAnimationActive
                  />
                  <Line
                    type="monotone"
                    dataKey="p50"
                    stroke="var(--color-success)"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {!result && !running && (
        <div className="rounded-3xl hairline bg-surface p-10 text-center ring-soft">
          <div className="text-base font-semibold">Run a simulation to see results</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            We'll generate {paths.toLocaleString()} possible futures using your inputs. Heavier runs
            take longer but tighten the confidence bands. Computation runs in a Web Worker — your UI
            stays responsive.
          </p>
        </div>
      )}
    </div>
  );
}
