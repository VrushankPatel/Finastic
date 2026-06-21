import { project } from "./projection";
import { fiScore } from "./fire";
import type { Profile } from "./types";

export interface Insight {
  id: string;
  title: string;
  body: string;
  tone: "good" | "warn" | "info";
}

/** Diff-based insights: tweak one input, see how FI age moves. */
export function generateInsights(profile: Profile): Insight[] {
  const base = project(profile);
  const out: Insight[] = [];

  function trial(mut: (p: Profile) => Profile, label: (delta: number) => Insight) {
    const next = mut(structuredClone(profile));
    const p = project(next);
    const baseFi = base.fiAge ?? base.rows.at(-1)?.age ?? profile.lifeExpectancy;
    const newFi = p.fiAge ?? p.rows.at(-1)?.age ?? profile.lifeExpectancy;
    const delta = baseFi - newFi; // positive = earlier FI
    if (Math.abs(delta) >= 0.5) out.push(label(delta));
  }

  trial(
    (p) => ({ ...p, retirementExpenses: p.retirementExpenses * 0.9 }),
    (d) => ({
      id: "exp-down-10",
      tone: d > 0 ? "good" : "info",
      title: `Cut retirement spending 10% → FI ${d > 0 ? "" : "+"}${Math.abs(d).toFixed(1)} yr ${d > 0 ? "earlier" : "later"}`,
      body: "Spending is the single most powerful lever — it lowers your target and stretches every dollar.",
    }),
  );

  trial(
    (p) => ({ ...p, annualContributions: p.annualContributions * 1.2 }),
    (d) => ({
      id: "save-up-20",
      tone: "good",
      title: `Save 20% more per year → FI ${Math.abs(d).toFixed(1)} yr ${d > 0 ? "earlier" : "later"}`,
      body: "Compounding rewards early extra contributions disproportionately.",
    }),
  );

  trial(
    (p) => ({ ...p, retirementAge: Math.min(p.lifeExpectancy - 1, p.retirementAge + 1) }),
    (d) => ({
      id: "work-one-more",
      tone: "info",
      title: `Work one extra year → portfolio grows ${((1 + profile.expectedReturn - 1) * 100).toFixed(1)}%+ before withdrawals start`,
      body: "Each working year both adds savings and removes a year of withdrawals — outsized impact on success rates.",
    }),
  );

  const score = fiScore(profile);
  if (score < 30) {
    out.unshift({
      id: "low-score",
      tone: "warn",
      title: "Your FI score is in the early-stage zone",
      body: "Focus on raising savings rate and locking in lower expenses before optimizing investments.",
    });
  } else if (score > 75) {
    out.unshift({
      id: "high-score",
      tone: "good",
      title: "You're on a strong trajectory",
      body: "Consider sequence-of-returns protection and tax-efficient withdrawal sequencing.",
    });
  }

  return out.slice(0, 4);
}
