import { createFileRoute } from "@tanstack/react-router";
import { usePlannerStore } from "@/stores/planner";
import { Field, NumberInput } from "@/components/app/field";
import { Slider } from "@/components/ui/slider";
import type { IncomeStream, Profile } from "@/lib/fi/types";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { CURRENCIES, useUIStore } from "@/stores/ui";

export const Route = createFileRoute("/inputs")({
  head: () => ({
    meta: [
      { title: "Inputs · Finastic" },
      { name: "description", content: "Edit your profile, assumptions and cashflow." },
    ],
  }),
  component: InputsPage,
});

function InputsPage() {
  const scenario = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));
  const updateActive = usePlannerStore((s) => s.updateActive);
  const currencyCode = useUIStore((s) => s.currency);
  const moneyPrefix = CURRENCIES[currencyCode].symbol;
  if (!scenario) return null;
  const p = scenario.profile;

  const set =
    <K extends keyof Profile>(k: K) =>
    (v: Profile[K]) =>
      void updateActive((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Inputs</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your numbers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Autosaves to this device. Everything below is in today's dollars unless noted.
        </p>
      </header>

      <Section title="You" subtitle="Age, retirement, longevity">
        <Field label="Current age">
          <NumberInput
            value={p.currentAge}
            onChange={(v) => set("currentAge")(Math.min(p.retirementAge - 1, Math.max(15, v)))}
          />
        </Field>
        <Field label="Target retirement age">
          <NumberInput
            value={p.retirementAge}
            onChange={(v) =>
              set("retirementAge")(Math.min(p.lifeExpectancy - 1, Math.max(p.currentAge + 1, v)))
            }
          />
        </Field>
        <Field label="Life expectancy">
          <NumberInput
            value={p.lifeExpectancy}
            onChange={(v) => set("lifeExpectancy")(Math.max(p.retirementAge + 1, v))}
          />
        </Field>
      </Section>

      <Section title="Wealth" subtitle="What you have today">
        <Field label="Cash & savings">
          <NumberInput
            value={p.currentSavings}
            prefix={moneyPrefix}
            step={1000}
            onChange={(v) => set("currentSavings")(Math.max(0, v))}
          />
        </Field>
        <Field label="Investments">
          <NumberInput
            value={p.currentInvestments}
            prefix={moneyPrefix}
            step={1000}
            onChange={(v) => set("currentInvestments")(Math.max(0, v))}
          />
        </Field>
        <Field label="Debt (non-mortgage)">
          <NumberInput
            value={p.debt}
            prefix={moneyPrefix}
            step={500}
            onChange={(v) => set("debt")(Math.max(0, v))}
          />
        </Field>
      </Section>

      <Section title="Cashflow" subtitle="Income, contributions, expenses">
        <Field label="Annual salary (gross)">
          <NumberInput
            value={p.annualSalary}
            prefix={moneyPrefix}
            step={1000}
            onChange={(v) => set("annualSalary")(Math.max(0, v))}
          />
        </Field>
        <Field label="Salary growth">
          <PercentSlider
            value={p.salaryGrowth}
            onChange={set("salaryGrowth")}
            min={-0.05}
            max={0.15}
          />
        </Field>
        <Field label="Annual contributions (you + employer)">
          <NumberInput
            value={p.annualContributions}
            prefix={moneyPrefix}
            step={500}
            onChange={(v) => set("annualContributions")(Math.max(0, v))}
          />
        </Field>
        <Field label="Annual expenses (today)">
          <NumberInput
            value={p.annualExpenses}
            prefix={moneyPrefix}
            step={500}
            onChange={(v) => set("annualExpenses")(Math.max(0, v))}
          />
        </Field>
        <Field label="Retirement expenses (today's $)">
          <NumberInput
            value={p.retirementExpenses}
            prefix={moneyPrefix}
            step={500}
            onChange={(v) => set("retirementExpenses")(Math.max(0, v))}
          />
        </Field>
      </Section>

      <Section title="Market assumptions" subtitle="Real-world inflation & returns">
        <Field label="Inflation">
          <PercentSlider value={p.inflation} onChange={set("inflation")} min={0} max={0.1} />
        </Field>
        <Field label="Expected return">
          <PercentSlider
            value={p.expectedReturn}
            onChange={set("expectedReturn")}
            min={0}
            max={0.15}
          />
        </Field>
        <Field label="Portfolio volatility (σ)">
          <PercentSlider
            value={p.expectedVolatility}
            onChange={set("expectedVolatility")}
            min={0.02}
            max={0.4}
          />
        </Field>
        <Field label="Safe withdrawal rate (SWR)">
          <PercentSlider value={p.swr} onChange={set("swr")} min={0.02} max={0.08} />
        </Field>
      </Section>

      <Section title="Future income" subtitle="Pensions & social security">
        <Field label="Social Security start age">
          <NumberInput
            value={p.socialSecurityAge}
            onChange={(v) => set("socialSecurityAge")(Math.max(50, Math.min(80, v)))}
          />
        </Field>
        <Field label="Social Security monthly">
          <NumberInput
            value={p.socialSecurityMonthly}
            prefix={moneyPrefix}
            step={100}
            onChange={(v) => set("socialSecurityMonthly")(Math.max(0, v))}
          />
        </Field>
        <Field label="Pension start age">
          <NumberInput
            value={p.pensionAge}
            onChange={(v) => set("pensionAge")(Math.max(40, Math.min(80, v)))}
          />
        </Field>
        <Field label="Pension monthly">
          <NumberInput
            value={p.pensionMonthly}
            prefix={moneyPrefix}
            step={100}
            onChange={(v) => set("pensionMonthly")(Math.max(0, v))}
          />
        </Field>
      </Section>

      <Section title="Recurring streams" subtitle="Employer plans, EPF, PPF, NPS, rental income">
        {p.incomeStreams.map((stream) => (
          <IncomeStreamEditor
            key={stream.id}
            stream={stream}
            moneyPrefix={moneyPrefix}
            onChange={(next) =>
              void updateActive((prev) => ({
                ...prev,
                incomeStreams: prev.incomeStreams.map((s) => (s.id === stream.id ? next : s)),
              }))
            }
            onRemove={() =>
              void updateActive((prev) => ({
                ...prev,
                incomeStreams: prev.incomeStreams.filter((s) => s.id !== stream.id),
              }))
            }
          />
        ))}
        <button
          type="button"
          onClick={() =>
            void updateActive((prev) => ({
              ...prev,
              incomeStreams: [
                ...prev.incomeStreams,
                {
                  id: crypto.randomUUID(),
                  label: "New stream",
                  kind: "contribution",
                  amount: 0,
                  startAge: prev.currentAge,
                  endAge: prev.retirementAge,
                  growth: prev.inflation,
                },
              ],
            }))
          }
          className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--hairline)] bg-surface/60 p-4 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add stream
        </button>
      </Section>
    </div>
  );
}

function IncomeStreamEditor({
  stream,
  moneyPrefix,
  onChange,
  onRemove,
}: {
  stream: IncomeStream;
  moneyPrefix: string;
  onChange: (stream: IncomeStream) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl hairline bg-surface-2 p-4">
      <div className="mb-3 flex items-center gap-2">
        <input
          aria-label="Stream label"
          value={stream.label}
          onChange={(e) => onChange({ ...stream, label: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none focus:text-success"
        />
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Remove ${stream.label}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Annual amount">
          <NumberInput
            value={stream.amount}
            prefix={moneyPrefix}
            step={1000}
            onChange={(amount) => onChange({ ...stream, amount: Math.max(0, amount) })}
          />
        </Field>
        <Field label="Type">
          <select
            aria-label="Stream type"
            value={stream.kind}
            onChange={(e) => onChange({ ...stream, kind: e.target.value as IncomeStream["kind"] })}
            className="h-10 rounded-xl hairline bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="contribution">Contribution</option>
            <option value="income">Income</option>
          </select>
        </Field>
        <Field label="Growth">
          <PercentSlider
            value={stream.growth}
            onChange={(growth) => onChange({ ...stream, growth })}
            min={0}
            max={0.15}
          />
        </Field>
        <Field label="Start age">
          <NumberInput
            value={stream.startAge}
            onChange={(startAge) =>
              onChange({ ...stream, startAge: Math.max(0, Math.min(stream.endAge, startAge)) })
            }
          />
        </Field>
        <Field label="End age">
          <NumberInput
            value={stream.endAge}
            onChange={(endAge) =>
              onChange({ ...stream, endAge: Math.max(stream.startAge, Math.min(120, endAge)) })
            }
          />
        </Field>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6"
    >
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <div>
          <div className="text-base font-semibold text-foreground">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </motion.section>
  );
}

function PercentSlider({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex h-10 items-center gap-3 rounded-xl hairline bg-surface px-3">
      <Slider
        value={[value * 100]}
        min={min * 100}
        max={max * 100}
        step={0.1}
        onValueChange={(v) => onChange((v[0] ?? 0) / 100)}
        className="flex-1"
      />
      <span className="font-mono text-xs text-foreground tabular">{(value * 100).toFixed(1)}%</span>
    </div>
  );
}
