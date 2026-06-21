import { createFileRoute } from "@tanstack/react-router";
import { usePlannerStore } from "@/stores/planner";
import { withdrawalStrategies } from "@/lib/fi/withdrawal";
import { currency, percent } from "@/lib/fi/format";
import { motion } from "framer-motion";

export const Route = createFileRoute("/withdrawal")({
  head: () => ({
    meta: [
      { title: "Withdrawal · Finastic" },
      { name: "description", content: "Compare retirement withdrawal strategies side by side." },
    ],
  }),
  component: WithdrawalPage,
});

function WithdrawalPage() {
  const scenario = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));
  if (!scenario) return null;
  const strategies = withdrawalStrategies(scenario.profile);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Withdrawal</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Strategy comparison</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fixed % rules are simple; dynamic strategies adapt to markets and almost never deplete.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {strategies.map((s, i) => {
          const tone = s.depletionRisk < 0.1 ? "good" : s.depletionRisk < 0.3 ? "ok" : "bad";
          return (
            <motion.div
              key={s.strategy}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className="flex flex-col gap-3 rounded-3xl hairline bg-surface p-5 ring-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-base font-semibold text-foreground">{s.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.description}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${
                    tone === "good"
                      ? "bg-success/15 text-success"
                      : tone === "ok"
                        ? "bg-info/15 text-info"
                        : "bg-warning/15 text-warning"
                  }`}
                >
                  {tone === "good" ? "Robust" : tone === "ok" ? "Moderate" : "Risky"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-surface-2 p-3">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Year 1 spend
                  </div>
                  <div className="mt-0.5 font-mono text-base text-foreground">
                    {currency(s.initialWithdrawal, { compact: true })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {currency(s.initialWithdrawal / 12, { compact: true })}/mo
                  </div>
                </div>
                <div className="rounded-lg bg-surface-2 p-3">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Depletion risk
                  </div>
                  <div className="mt-0.5 font-mono text-base text-foreground">
                    {percent(s.depletionRisk)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">over plan horizon</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
}
