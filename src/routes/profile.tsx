import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, CircleDollarSign, Landmark, Palette, UserRound } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { FiGauge } from "@/components/app/fi-gauge";
import { Field } from "@/components/app/field";
import { Metric } from "@/components/app/metric";
import { allocationStats } from "@/lib/fi/portfolio";
import { fiScore } from "@/lib/fi/fire";
import { currency, percent } from "@/lib/fi/format";
import { project } from "@/lib/fi/projection";
import { usePlannerStore } from "@/stores/planner";
import { ACCENTS, CURRENCIES, type AccentId, type CurrencyCode, useUIStore } from "@/stores/ui";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Finastic" },
      { name: "description", content: "Personal profile, preferences and plan summary." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const scenario = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));
  const updateActive = usePlannerStore((s) => s.updateActive);
  const { theme, setTheme, accent, setAccent, currency: currencyCode, setCurrency } = useUIStore();

  const data = useMemo(() => {
    if (!scenario) return null;
    const profile = scenario.profile;
    const projection = project(profile);
    const stats = allocationStats(profile.allocation);
    const score = fiScore(profile);
    const yearsToFi = projection.fiAge ? projection.fiAge - profile.currentAge : null;
    const activeStreams = profile.incomeStreams.filter((s) => s.amount > 0);
    return { projection, stats, score, yearsToFi, activeStreams };
  }, [scenario]);

  if (!scenario || !data) return null;

  const profile = scenario.profile;
  const netWorth = profile.currentSavings + profile.currentInvestments - profile.debt;
  const savingsRate =
    profile.annualSalary > 0
      ? (data.projection.rows[0]?.contribution ?? profile.annualContributions) /
        profile.annualSalary
      : 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Profile</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Plan owner & preferences</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The Finastick profile view folded into the local-first planner.
          </p>
        </div>
        <Link
          to="/inputs"
          className="inline-flex h-10 min-h-11 items-center gap-2 rounded-xl bg-success px-4 text-sm font-medium text-success-foreground shadow-lg shadow-success/10 transition-transform hover:scale-[1.02]"
        >
          Edit numbers <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="grid gap-4 lg:grid-cols-[280px,1fr]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center gap-3 rounded-3xl hairline bg-surface p-6 ring-soft"
        >
          <FiGauge score={data.score} />
          <div className="text-center">
            <div className="text-base font-semibold text-foreground">{profile.name}</div>
            <div className="text-xs text-muted-foreground">Scenario · {scenario.name}</div>
          </div>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Net worth"
            value={currency(netWorth, { compact: true })}
            accent="success"
            hint="Assets minus debt"
          />
          <Metric
            label="Savings rate"
            value={percent(savingsRate)}
            accent={savingsRate >= 0.25 ? "success" : "warning"}
            hint="Includes contribution streams"
          />
          <Metric
            label="Retirement age"
            value={profile.retirementAge}
            accent="info"
            hint={
              data.yearsToFi !== null
                ? `FI around age ${data.projection.fiAge}`
                : "Outside current horizon"
            }
          />
          <Metric
            label="Plan currency"
            value={currencyCode}
            accent="sim"
            hint={CURRENCIES[currencyCode].label}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-info" />
            <div className="text-sm font-semibold text-foreground">Identity</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={profile.name}
                onChange={(e) => void updateActive((prev) => ({ ...prev, name: e.target.value }))}
                className="h-10 rounded-xl hairline bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Currency">
              <select
                value={currencyCode}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="h-10 rounded-xl hairline bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                  <option key={code} value={code}>
                    {CURRENCIES[code].symbol} {CURRENCIES[code].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Theme">
              <div className="inline-flex h-10 overflow-hidden rounded-xl hairline bg-surface">
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 px-3 text-sm ${theme === "dark" ? "bg-success/15 text-foreground" : "text-muted-foreground"}`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 px-3 text-sm ${theme === "light" ? "bg-success/15 text-foreground" : "text-muted-foreground"}`}
                >
                  Light
                </button>
              </div>
            </Field>
            <Field label="Accent">
              <div className="flex h-10 items-center gap-2">
                {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
                  <button
                    key={id}
                    onClick={() => setAccent(id)}
                    aria-label={ACCENTS[id].label}
                    className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-surface transition ${accent === id ? "ring-2 ring-foreground" : "ring-1 ring-[var(--hairline)] hover:ring-foreground/40"}`}
                    style={{ background: ACCENTS[id].swatch }}
                  />
                ))}
              </div>
            </Field>
          </div>
        </div>

        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-success" />
            <div className="text-sm font-semibold text-foreground">Recurring streams</div>
          </div>
          <div className="space-y-2">
            {data.activeStreams.length === 0 && (
              <div className="rounded-2xl bg-surface-2 p-4 text-sm text-muted-foreground">
                No recurring streams configured.
              </div>
            )}
            {data.activeStreams.map((stream) => (
              <div
                key={stream.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-3"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{stream.label}</div>
                  <div className="text-xs capitalize text-muted-foreground">
                    {stream.kind} · ages {stream.startAge}-{stream.endAge}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold text-foreground">
                  {currency(stream.amount, { compact: true })}/yr
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ProfileStat
          icon={<CircleDollarSign className="h-4 w-4" />}
          label="FI target"
          value={currency(data.projection.fiTarget, { compact: true })}
        />
        <ProfileStat
          icon={<Palette className="h-4 w-4" />}
          label="Expected return"
          value={percent(data.stats.expectedReturn)}
        />
        <ProfileStat
          icon={<Landmark className="h-4 w-4" />}
          label="Portfolio volatility"
          value={percent(data.stats.volatility)}
        />
      </section>
    </div>
  );
}

function ProfileStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl hairline bg-surface p-4 ring-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <div className="text-xs uppercase tracking-[0.12em]">{label}</div>
      </div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
