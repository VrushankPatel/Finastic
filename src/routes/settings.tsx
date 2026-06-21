import { createFileRoute } from "@tanstack/react-router";
import { usePlannerStore } from "@/stores/planner";
import { useUIStore } from "@/stores/ui";
import { Download, Upload, Trash2, Lock, Moon, Sun } from "lucide-react";
import { useRef, useState } from "react";
import { ScenarioSchema, type Scenario } from "@/lib/fi/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Finastic" },
      { name: "description", content: "Theme, data, privacy and about." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const scenarios = usePlannerStore((s) => s.scenarios);
  const importScenarios = usePlannerStore((s) => s.importScenarios);
  const resetAll = usePlannerStore((s) => s.resetAll);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ version: 1, scenarios }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finastic-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    if (scenarios.length === 0) return;
    const headers = [
      "scenario",
      "name",
      "currentAge",
      "retirementAge",
      "lifeExpectancy",
      "currentNetWorth",
      "annualSalary",
      "annualContributions",
      "retirementExpenses",
      "swr",
    ];
    const rows = scenarios.map((s) => [
      s.id,
      JSON.stringify(s.name),
      s.profile.currentAge,
      s.profile.retirementAge,
      s.profile.lifeExpectancy,
      s.profile.currentSavings + s.profile.currentInvestments,
      s.profile.annualSalary,
      s.profile.annualContributions,
      s.profile.retirementExpenses,
      s.profile.swr,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finastic-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed?.scenarios) ? parsed.scenarios : [];
      const valid: Scenario[] = [];
      for (const s of list) {
        const r = ScenarioSchema.safeParse(s);
        if (r.success) valid.push(r.data);
      }
      if (valid.length === 0) {
        setMessage("No valid scenarios found in that file.");
        return;
      }
      await importScenarios(valid);
      setMessage(`Imported ${valid.length} scenario(s).`);
    } catch (e) {
      setMessage("Failed to read file.");
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Settings</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Preferences & data</h1>
      </header>

      <section className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
        <div className="flex items-center gap-2 text-success">
          <Lock className="h-4 w-4" />
          <div className="text-sm font-medium">Your financial data never leaves your device.</div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          All inputs, scenarios and simulation results live in this browser's IndexedDB. No network
          requests are made for any planning feature. Use export to make portable backups.
        </p>
      </section>

      <section className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
        <div className="text-base font-semibold">Appearance</div>
        <div className="mt-3 inline-flex overflow-hidden rounded-xl hairline bg-surface-2">
          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${theme === "dark" ? "bg-success/15 text-foreground" : "text-muted-foreground"}`}
          >
            <Moon className="h-4 w-4" /> Dark
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${theme === "light" ? "bg-success/15 text-foreground" : "text-muted-foreground"}`}
          >
            <Sun className="h-4 w-4" /> Light
          </button>
        </div>
      </section>

      <section className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
        <div className="text-base font-semibold">Data</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Export, import, or wipe local data.
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={exportJson}
            className="inline-flex h-10 items-center gap-2 rounded-xl hairline bg-surface-2 px-3 text-xs text-foreground hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" /> Export JSON
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex h-10 items-center gap-2 rounded-xl hairline bg-surface-2 px-3 text-xs text-foreground hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-xl hairline bg-surface-2 px-3 text-xs text-foreground hover:bg-accent"
          >
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={async () => {
              if (confirm("Wipe all local data? This cannot be undone.")) {
                await resetAll();
                setMessage("All local data cleared.");
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 text-xs text-destructive hover:bg-destructive/20"
          >
            <Trash2 className="h-3.5 w-3.5" /> Wipe all data
          </button>
        </div>
        {message && <div className="mt-3 text-xs text-muted-foreground">{message}</div>}
      </section>

      <section className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
        <div className="text-base font-semibold">About</div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Finastic is a local-first financial independence planner. Monte Carlo runs in a Web
          Worker, returns are simulated with seeded Box-Muller normals plus optional fat-tailed
          Student-t mixing, and historical stress sequences replay 2000, 2008, 1970s and lost-decade
          environments at the start of retirement. Models are simplifications — use professional
          advice for real decisions.
        </p>
      </section>
    </div>
  );
}
