import { project } from "./projection";
import type { FireVariant, Profile } from "./types";

export interface FireTarget {
  variant: FireVariant;
  label: string;
  description: string;
  number: number;
  yearsAway: number | null;
  monthlyTarget: number;
}

const VARIANT_META: Record<
  FireVariant,
  { label: string; description: string; multiplier: number | "coast" | "barista" | "slow" }
> = {
  lean: {
    label: "Lean FIRE",
    description: "Minimalist retirement — 70% of current spending",
    multiplier: 0.7,
  },
  traditional: {
    label: "Traditional FIRE",
    description: "Maintain current lifestyle in retirement",
    multiplier: 1,
  },
  fat: {
    label: "Fat FIRE",
    description: "Generous lifestyle — 150% of current spending",
    multiplier: 1.5,
  },
  barista: {
    label: "Barista FIRE",
    description: "Part-time income covers half of expenses",
    multiplier: "barista",
  },
  coast: {
    label: "Coast FIRE",
    description: "Already saved enough; coast to traditional FI",
    multiplier: "coast",
  },
  slow: { label: "Slow FIRE", description: "Lower savings, slower path", multiplier: "slow" },
  custom: { label: "Custom", description: "Your own target", multiplier: 1 },
};

export function fireNumbers(profile: Profile): FireTarget[] {
  const realReturn = (1 + profile.expectedReturn) / (1 + profile.inflation) - 1;
  const proj = project(profile);
  const rowsByAge = new Map(proj.rows.map((r) => [r.age, r]));

  const traditional = profile.retirementExpenses / Math.max(profile.swr, 0.005);

  function findYearsAway(target: number) {
    const row = proj.rows.find((r) => r.endBalance >= target);
    return row ? row.age - profile.currentAge : null;
  }

  function monthlyTargetFor(target: number) {
    // PMT-like: required monthly savings to reach target by retirementAge
    const n = Math.max(1, profile.retirementAge - profile.currentAge);
    const currentRow = rowsByAge.get(profile.currentAge);
    const startBalance = currentRow?.startBalance ?? 0;
    const r = realReturn;
    const fvOfCurrent = startBalance * Math.pow(1 + r, n);
    const remaining = Math.max(0, target - fvOfCurrent);
    if (r === 0) return remaining / n / 12;
    const annualPmt = (remaining * r) / (Math.pow(1 + r, n) - 1);
    return Math.max(0, annualPmt / 12);
  }

  return (Object.keys(VARIANT_META) as FireVariant[]).map((v) => {
    const meta = VARIANT_META[v];
    let num = traditional;
    if (typeof meta.multiplier === "number") {
      num = (profile.retirementExpenses * meta.multiplier) / Math.max(profile.swr, 0.005);
    } else if (meta.multiplier === "barista") {
      // half of expenses covered by part-time income forever
      num = (profile.retirementExpenses * 0.5) / Math.max(profile.swr, 0.005);
    } else if (meta.multiplier === "coast") {
      // amount today that, with growth alone, becomes traditional by retirement age
      const n = Math.max(1, profile.retirementAge - profile.currentAge);
      num = traditional / Math.pow(1 + realReturn, n);
    } else if (meta.multiplier === "slow") {
      num = traditional; // same target, just a slower savings pace — see monthlyTarget
    }
    let monthly = monthlyTargetFor(num);
    if (meta.multiplier === "slow") monthly *= 0.6;
    return {
      variant: v,
      label: meta.label,
      description: meta.description,
      number: num,
      yearsAway: findYearsAway(num),
      monthlyTarget: monthly,
    };
  });
}

/** A 0–100 FI score: blends progress to target, savings rate, and runway. */
export function fiScore(profile: Profile): number {
  const proj = project(profile);
  const target = profile.retirementExpenses / Math.max(profile.swr, 0.005);
  const balance = proj.rows[0]?.endBalance ?? 0;
  const progress = Math.min(1, balance / Math.max(1, target));
  const savingsRate =
    profile.annualSalary > 0 ? Math.min(1, profile.annualContributions / profile.annualSalary) : 0;
  const runway =
    profile.annualExpenses > 0 ? Math.min(1, balance / (profile.annualExpenses * 25)) : 0;
  const score = (progress * 0.55 + savingsRate * 0.25 + runway * 0.2) * 100;
  return Math.max(0, Math.min(100, score));
}
