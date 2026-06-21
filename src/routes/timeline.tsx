import { createFileRoute } from "@tanstack/react-router";
import { usePlannerStore } from "@/stores/planner";
import { motion } from "framer-motion";
import { useState } from "react";
import { Field, NumberInput } from "@/components/app/field";
import { Plus, Trash2 } from "lucide-react";
import { currency } from "@/lib/fi/format";
import type { LifeEvent } from "@/lib/fi/types";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline · Finastic" },
      { name: "description", content: "A visual life roadmap to age 95." },
    ],
  }),
  component: TimelinePage,
});

const KIND_META: Record<LifeEvent["kind"], { color: string; label: string }> = {
  windfall: { color: "var(--color-success)", label: "Windfall" },
  expense: { color: "var(--color-warning)", label: "Expense" },
  milestone: { color: "var(--color-info)", label: "Milestone" },
};

function TimelinePage() {
  const scenario = usePlannerStore((s) => s.scenarios.find((x) => x.id === s.activeId));
  const updateActive = usePlannerStore((s) => s.updateActive);
  const [draft, setDraft] = useState<{
    label: string;
    age: number;
    amount: number;
    kind: LifeEvent["kind"];
  }>({
    label: "",
    age: scenario?.profile.currentAge ?? 30,
    amount: 0,
    kind: "milestone",
  });

  if (!scenario) return null;
  const p = scenario.profile;
  const minAge = p.currentAge;
  const maxAge = p.lifeExpectancy;

  const span = maxAge - minAge;
  const events = [...p.lifeEvents].sort((a, b) => a.age - b.age);

  function addEvent() {
    if (!draft.label.trim()) return;
    const e: LifeEvent = {
      id: crypto.randomUUID(),
      label: draft.label.trim(),
      age: Math.max(minAge, Math.min(maxAge, draft.age)),
      amount: draft.kind === "expense" ? -Math.abs(draft.amount) : Math.abs(draft.amount),
      kind: draft.kind,
    };
    void updateActive((prev) => ({ ...prev, lifeEvents: [...prev.lifeEvents, e] }));
    setDraft({ label: "", age: p.currentAge, amount: 0, kind: "milestone" });
  }

  function removeEvent(id: string) {
    void updateActive((prev) => ({
      ...prev,
      lifeEvents: prev.lifeEvents.filter((e) => e.id !== id),
    }));
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Timeline</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Life roadmap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Age {minAge} → {maxAge}. Add windfalls, milestones, and one-off expenses; they flow into
          your projection.
        </p>
      </header>

      <section className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
        <div className="relative h-3 w-full rounded-full bg-surface-2">
          <div
            className="absolute inset-y-0 rounded-full bg-success/30"
            style={{ left: 0, width: `${((p.retirementAge - minAge) / span) * 100}%` }}
          />
          <div
            className="absolute -top-1 h-5 w-px bg-success"
            style={{ left: `${((p.retirementAge - minAge) / span) * 100}%` }}
            aria-label="Retirement"
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>Age {minAge} · today</span>
          <span>Retirement · {p.retirementAge}</span>
          <span>{maxAge}</span>
        </div>

        <div className="relative mt-8 h-32">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--hairline)]" />
          {events.map((e, i) => {
            const x = ((e.age - minAge) / span) * 100;
            const above = i % 2 === 0;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute"
                style={{
                  left: `calc(${x}% - 6px)`,
                  top: above ? "calc(50% - 56px)" : "calc(50% + 8px)",
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  {above && (
                    <Pin label={e.label} amount={e.amount} color={KIND_META[e.kind].color} />
                  )}
                  <span
                    className="h-3 w-3 rounded-full ring-2 ring-background"
                    style={{ background: KIND_META[e.kind].color }}
                  />
                  {!above && (
                    <Pin label={e.label} amount={e.amount} color={KIND_META[e.kind].color} />
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground">{e.age}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr,360px]">
        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="text-base font-semibold">Events</div>
          {events.length === 0 ? (
            <div className="mt-3 text-sm text-muted-foreground">
              No events yet. Add a child, home purchase, sabbatical, or inheritance.
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--hairline)]">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: KIND_META[e.kind].color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-foreground">{e.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Age {e.age} · {KIND_META[e.kind].label}
                    </div>
                  </div>
                  <div
                    className={`font-mono text-sm ${e.amount >= 0 ? "text-success" : "text-warning"}`}
                  >
                    {e.amount >= 0 ? "+" : "−"}
                    {currency(Math.abs(e.amount), { compact: true })}
                  </div>
                  <button
                    onClick={() => removeEvent(e.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl hairline bg-surface p-5 ring-soft sm:p-6">
          <div className="text-base font-semibold">Add event</div>
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Label">
              <input
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="e.g. House purchase"
                className="h-10 rounded-xl hairline bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age">
                <NumberInput
                  value={draft.age}
                  min={minAge}
                  max={maxAge}
                  onChange={(v) => setDraft((d) => ({ ...d, age: v }))}
                />
              </Field>
              <Field label="Amount (today's $)">
                <NumberInput
                  value={draft.amount}
                  prefix="$"
                  step={1000}
                  onChange={(v) => setDraft((d) => ({ ...d, amount: v }))}
                />
              </Field>
            </div>
            <Field label="Kind">
              <div className="inline-flex overflow-hidden rounded-xl hairline bg-surface">
                {(["milestone", "windfall", "expense"] as LifeEvent["kind"][]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setDraft((d) => ({ ...d, kind: k }))}
                    className={`flex-1 px-3 py-2 text-xs ${draft.kind === k ? "bg-info/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {KIND_META[k].label}
                  </button>
                ))}
              </div>
            </Field>
            <button
              onClick={addEvent}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-success px-4 text-sm font-medium text-success-foreground"
            >
              <Plus className="h-4 w-4" /> Add event
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Pin({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div
      className="max-w-[10rem] rounded-md bg-surface-2 px-2 py-1 text-center"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div className="truncate text-[10px] text-foreground">{label}</div>
      <div className="text-[9px] font-mono text-muted-foreground">
        {amount >= 0 ? "+" : "−"}
        {currency(Math.abs(amount), { compact: true })}
      </div>
    </div>
  );
}
