import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePlannerStore } from "@/stores/planner";
import { project } from "@/lib/fi/projection";
import { fireNumbers, fiScore } from "@/lib/fi/fire";
import { allocationStats } from "@/lib/fi/portfolio";
import { generateInsights } from "@/lib/fi/insights";
import { currency, percent, years as fmtYears } from "@/lib/fi/format";
import { FiGauge } from "@/components/app/fi-gauge";
import { Metric } from "@/components/app/metric";
import { NumberTicker } from "@/components/app/number-ticker";
import { PrivacyBanner } from "@/components/app/privacy-banner";
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Finastic" },
      { name: "description", content: "Your financial independence dashboard." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const scenario = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));

  const data = useMemo(() => {
    if (!scenario) return null;
    const proj = project(scenario.profile);
    const score = fiScore(scenario.profile);
    const fires = fireNumbers(scenario.profile);
    const stats = allocationStats(scenario.profile.allocation);
    const insights = generateInsights(scenario.profile);
    const traditional = fires.find((f) => f.variant === "traditional")!;
    const savingsRate =
      scenario.profile.annualSalary > 0
        ? scenario.profile.annualContributions / scenario.profile.annualSalary
        : 0;
    const expectedIncome = traditional.number * scenario.profile.swr;
    return { proj, score, fires, stats, insights, traditional, savingsRate, expectedIncome };
  }, [scenario]);

  if (!scenario || !data) return null;

  const { proj, score, fires, stats, insights, traditional, savingsRate, expectedIncome } = data;
  const netWorth = proj.rows[0]?.endBalance ?? 0;
  const fiAge = proj.fiAge ?? null;
  const yearsToFi = fiAge !== null ? Math.max(0, fiAge - scenario.profile.currentAge) : null;
  const projectedFiYear =
    fiAge !== null ? new Date().getFullYear() + (fiAge - scenario.profile.currentAge) : null;

  const chartData = proj.rows.map((r) => ({
    age: r.age,
    balance: Math.round(r.endBalance),
    target: Math.round(proj.fiTarget),
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <PrivacyBanner />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Plan · {scenario.name}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {projectedFiYear
                ? `On track to financial independence in ${projectedFiYear}`
                : `Currently outside your FI window — try What If`}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {yearsToFi !== null
                ? `That's ${fmtYears(yearsToFi)} from today, at age ${fiAge}.`
                : `Adjust savings, expenses, or retirement age to find a feasible plan.`}
            </p>
          </div>
          <Link
            to="/inputs"
            className="inline-flex h-10 min-h-11 items-center gap-2 rounded-xl bg-success px-4 text-sm font-medium text-success-foreground shadow-lg shadow-success/10 transition-transform hover:scale-[1.02]"
          >
            Update inputs <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[260px,1fr]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center gap-2 rounded-3xl hairline bg-surface p-6 ring-soft"
        >
          <FiGauge score={score} />
          <div className="text-center text-xs text-muted-foreground">
            {score < 33
              ? "Early stage — focus on cashflow"
              : score < 66
                ? "Building momentum"
                : score < 90
                  ? "Approaching independence"
                  : "Financially independent"}
          </div>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric
            label="Net worth"
            accent="success"
            value={
              <NumberTicker
                value={netWorth}
                format={(n) => currency(n, { compact: netWorth > 1_000_000 })}
              />
            }
            hint="Cash + investments, today's $"
          />
          <Metric
            label="FI target"
            accent="info"
            value={currency(traditional.number, { compact: true })}
            hint={`At ${percent(scenario.profile.swr)} safe withdrawal`}
          />
          <Metric
            label="Years to FI"
            accent="sim"
            value={yearsToFi !== null ? fmtYears(yearsToFi) : "—"}
            hint={fiAge !== null ? `FI age ${fiAge}` : "Outside horizon"}
          />
          <Metric
            label="Savings rate"
            value={percent(savingsRate)}
            accent={savingsRate >= 0.25 ? "success" : savingsRate >= 0.15 ? "info" : "warning"}
            hint={`${currency(scenario.profile.annualContributions, { compact: true })} / yr`}
          />
          <Metric
            label="Expected income"
            value={`${currency(expectedIncome / 12, { compact: true })}/mo`}
            hint={`${currency(expectedIncome, { compact: true })} per year, in today's $`}
          />
          <Metric
            label="Portfolio σ"
            value={percent(stats.volatility)}
            accent={stats.volatility > 0.18 ? "warning" : "info"}
            hint={`E[return] ${percent(stats.expectedReturn)} · Diversification ${(stats.diversification * 100).toFixed(0)}`}
          />
        </div>
      </section>

      <section className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Net worth projection
            </div>
            <div className="mt-1 text-base font-medium text-foreground">
              Trajectory to age {scenario.profile.lifeExpectancy}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Target line: {currency(proj.fiTarget, { compact: true })}
          </div>
        </div>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
                formatter={(v: number) => currency(v, { compact: true })}
                labelFormatter={(l) => `Age ${l}`}
              />
              <ReferenceLine
                y={proj.fiTarget}
                stroke="var(--color-info)"
                strokeDasharray="3 3"
                strokeOpacity={0.7}
              />
              {fiAge !== null && (
                <ReferenceLine x={fiAge} stroke="var(--color-success)" strokeDasharray="3 3" />
              )}
              <Area
                dataKey="balance"
                stroke="var(--color-success)"
                fill="url(#balanceFill)"
                strokeWidth={2}
                isAnimationActive
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-info" />
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Insights
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {insights.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No insights yet — add more detail in Inputs.
              </li>
            )}
            {insights.map((ins, i) => (
              <motion.li
                key={ins.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3"
              >
                <span
                  className={`mt-1 h-2 w-2 rounded-full ${
                    ins.tone === "good"
                      ? "bg-success"
                      : ins.tone === "warn"
                        ? "bg-warning"
                        : "bg-info"
                  }`}
                />
                <div>
                  <div className="text-sm font-medium text-foreground">{ins.title}</div>
                  <div className="text-xs text-muted-foreground">{ins.body}</div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              FIRE variants
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {fires
              .filter((f) => f.variant !== "custom")
              .map((f) => (
                <li
                  key={f.variant}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{f.label}</div>
                    <div className="truncate text-xs text-muted-foreground">{f.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-foreground">
                      {currency(f.number, { compact: true })}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {f.yearsAway !== null ? `${fmtYears(f.yearsAway)} away` : "Beyond horizon"}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
