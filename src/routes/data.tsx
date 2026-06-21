import { createFileRoute } from "@tanstack/react-router";
import { Download, FileJson, TableProperties } from "lucide-react";
import { useMemo } from "react";
import { currency, percent } from "@/lib/fi/format";
import { project } from "@/lib/fi/projection";
import { usePlannerStore } from "@/stores/planner";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Data · Finastic" },
      { name: "description", content: "Inspect and export local planning data." },
    ],
  }),
  component: DataPage,
});

function DataPage() {
  const scenarios = usePlannerStore((s) => s.scenarios);
  const activeId = usePlannerStore((s) => s.activeId);
  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  const rows = useMemo(() => {
    if (!active) return [];
    return project(active.profile).rows.slice(0, 18);
  }, [active]);

  function download(name: string, text: string, type: string) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    download(
      `finastic-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ version: 2, scenarios }, null, 2),
      "application/json",
    );
  }

  function exportCsv() {
    const header = [
      "scenario",
      "year",
      "age",
      "startBalance",
      "contribution",
      "income",
      "expenses",
      "withdrawal",
      "growth",
      "endBalance",
    ];
    const lines = scenarios.flatMap((scenario) =>
      project(scenario.profile).rows.map((row) =>
        [
          JSON.stringify(scenario.name),
          row.year,
          row.age,
          Math.round(row.startBalance),
          Math.round(row.contribution),
          Math.round(row.income),
          Math.round(row.expenses),
          Math.round(row.withdrawal),
          Math.round(row.growth),
          Math.round(row.endBalance),
        ].join(","),
      ),
    );
    download(
      `finastic-projection-${new Date().toISOString().slice(0, 10)}.csv`,
      [header.join(","), ...lines].join("\n"),
      "text/csv",
    );
  }

  if (!active) return null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Data</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Local plan data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect projections and export the full local dataset.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportJson}
            className="inline-flex h-10 min-h-11 items-center gap-2 rounded-xl hairline bg-surface px-3 text-sm text-foreground hover:bg-accent"
          >
            <FileJson className="h-4 w-4" /> JSON
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex h-10 min-h-11 items-center gap-2 rounded-xl bg-success px-3 text-sm font-medium text-success-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DataCard label="Scenarios" value={String(scenarios.length)} />
        <DataCard label="Active plan" value={active.name} />
        <DataCard label="Safe withdrawal" value={percent(active.profile.swr)} />
        <DataCard
          label="Projection years"
          value={String(Math.max(0, active.profile.lifeExpectancy - active.profile.currentAge + 1))}
        />
      </section>

      <section className="overflow-hidden rounded-3xl hairline bg-surface ring-soft">
        <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-5 py-4">
          <TableProperties className="h-4 w-4 text-info" />
          <div className="text-sm font-semibold text-foreground">Projection preview</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr className="border-b border-[var(--hairline)]">
                <th className="px-5 py-3 font-medium">Year</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">Start</th>
                <th className="px-5 py-3 font-medium">Contribution</th>
                <th className="px-5 py-3 font-medium">Income</th>
                <th className="px-5 py-3 font-medium">Expenses</th>
                <th className="px-5 py-3 font-medium">End</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.year}-${row.age}`}
                  className="border-b border-[var(--hairline)] last:border-0"
                >
                  <td className="px-5 py-3 text-foreground">{row.year}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.age}</td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground">
                    {currency(row.startBalance, { compact: true })}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-success">
                    {currency(row.contribution, { compact: true })}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-info">
                    {currency(row.income, { compact: true })}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                    {currency(row.expenses, { compact: true })}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground">
                    {currency(row.endBalance, { compact: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl hairline bg-surface p-4 ring-soft">
      <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="mt-2 truncate text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
