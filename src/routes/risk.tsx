import { createFileRoute } from "@tanstack/react-router";
import { usePlannerStore } from "@/stores/planner";
import { assessRisk } from "@/lib/fi/risk";
import { motion } from "framer-motion";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Center · Finastic" },
      { name: "description", content: "Decompose the risks across your financial plan." },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  const scenario = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));
  if (!scenario) return null;
  const risks = assessRisk(scenario.profile);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Risk Center</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">What could derail this plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seven independent dimensions, scored from your active scenario.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {risks.map((r, i) => (
          <motion.article
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
            className="rounded-3xl hairline bg-surface p-5 ring-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-foreground">{r.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{r.description}</div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${
                  r.level === "low"
                    ? "bg-success/15 text-success"
                    : r.level === "medium"
                      ? "bg-info/15 text-info"
                      : "bg-warning/15 text-warning"
                }`}
              >
                {r.level}
              </span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className={`h-full ${
                  r.level === "low" ? "bg-success" : r.level === "medium" ? "bg-info" : "bg-warning"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${r.score}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="mt-1.5 text-right font-mono text-[11px] text-muted-foreground">
              {r.score.toFixed(0)} / 100
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  );
}
