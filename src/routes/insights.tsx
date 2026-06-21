import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Metric } from "@/components/app/metric";
import { fireNumbers, fiScore } from "@/lib/fi/fire";
import { currency, percent, years as fmtYears } from "@/lib/fi/format";
import { generateInsights } from "@/lib/fi/insights";
import { allocationStats } from "@/lib/fi/portfolio";
import { project } from "@/lib/fi/projection";
import { usePlannerStore } from "@/stores/planner";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · Finastic" },
      { name: "description", content: "Actionable financial independence insights." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const scenario = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));

  const data = useMemo(() => {
    if (!scenario) return null;
    const profile = scenario.profile;
    const projection = project(profile);
    const insights = generateInsights(profile);
    const fires = fireNumbers(profile);
    const stats = allocationStats(profile.allocation);
    const score = fiScore(profile);
    const netWorth = profile.currentSavings + profile.currentInvestments;
    const savingsRate =
      profile.annualSalary > 0 ? profile.annualContributions / profile.annualSalary : 0;
    const gap = Math.max(0, projection.fiTarget - netWorth);
    const contributionStreams = profile.incomeStreams.filter((s) => s.amount > 0);
    return {
      projection,
      insights,
      fires,
      stats,
      score,
      netWorth,
      savingsRate,
      gap,
      contributionStreams,
    };
  }, [scenario]);

  if (!scenario || !data) return null;

  const {
    projection,
    insights,
    fires,
    stats,
    score,
    netWorth,
    savingsRate,
    gap,
    contributionStreams,
  } = data;
  const yearsToFi = projection.fiAge
    ? Math.max(0, projection.fiAge - scenario.profile.currentAge)
    : null;
  const chartData = projection.rows.map((row) => ({
    age: row.age,
    portfolio: Math.round(row.endBalance),
    target: Math.round(projection.fiTarget),
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Insights</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">What moves the plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A Finastick-style readout of levers, gaps, and recurring contribution streams.
          </p>
        </div>
        <Link
          to="/inputs"
          className="inline-flex h-10 min-h-11 items-center gap-2 rounded-xl bg-success px-4 text-sm font-medium text-success-foreground shadow-lg shadow-success/10 transition-transform hover:scale-[1.02]"
        >
          Tune inputs <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="FI score"
          value={`${score.toFixed(0)}/100`}
          accent={score > 70 ? "success" : score > 40 ? "info" : "warning"}
          hint="Progress toward target"
        />
        <Metric
          label="Gap to FI"
          value={currency(gap, { compact: true })}
          accent={gap === 0 ? "success" : "info"}
          hint={`Target ${currency(projection.fiTarget, { compact: true })}`}
        />
        <Metric
          label="Savings rate"
          value={percent(savingsRate)}
          accent={savingsRate >= 0.25 ? "success" : "warning"}
          hint={`${currency(scenario.profile.annualContributions, { compact: true })} per year`}
        />
        <Metric
          label="Years to FI"
          value={yearsToFi !== null ? fmtYears(yearsToFi) : "Outside horizon"}
          accent={yearsToFi !== null ? "success" : "warning"}
          hint={projection.fiAge ? `Age ${projection.fiAge}` : "Try higher savings"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-info" />
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Action list
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {insights.map((insight) => (
              <article key={insight.id} className="rounded-2xl hairline bg-surface-2 p-4">
                <div className="flex items-start gap-3">
                  {insight.tone === "good" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : insight.tone === "warn" ? (
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  ) : (
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                  )}
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{insight.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {insight.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              FIRE variants
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {fires.map((fire) => (
              <div
                key={fire.variant}
                className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-3"
              >
                <div>
                  <div className="text-sm font-medium capitalize text-foreground">
                    {fire.variant}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currency(fire.annualSpend, { compact: true })} spending
                  </div>
                </div>
                <div className="text-right text-sm font-semibold text-foreground">
                  {currency(fire.number, { compact: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr,320px]">
        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Projection band
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="insightPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
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
                  width={64}
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
                <Area
                  dataKey="portfolio"
                  stroke="var(--success)"
                  fill="url(#insightPortfolio)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Plan texture
          </div>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <div className="text-muted-foreground">Expected return / volatility</div>
              <div className="mt-1 font-semibold text-foreground">
                {percent(stats.expectedReturn)} / {percent(stats.volatility)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Current net worth</div>
              <div className="mt-1 font-semibold text-foreground">
                {currency(netWorth, { compact: true })}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Recurring streams</div>
              <div className="mt-2 space-y-2">
                {contributionStreams.length === 0 && (
                  <div className="text-xs text-muted-foreground">No extra streams yet.</div>
                )}
                {contributionStreams.map((stream) => (
                  <div key={stream.id} className="rounded-xl bg-surface-2 px-3 py-2">
                    <div className="font-medium text-foreground">{stream.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {currency(stream.amount, { compact: true })}/yr · ages {stream.startAge}-
                      {stream.endAge}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
