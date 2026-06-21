import { allocationStats } from "./portfolio";
import { project } from "./projection";
import type { Profile } from "./types";

export interface RiskScore {
  id: string;
  label: string;
  score: number; // 0..100 (higher = more exposed)
  level: "low" | "medium" | "high";
  description: string;
}

export function assessRisk(profile: Profile): RiskScore[] {
  const stats = allocationStats(profile.allocation);
  const proj = project(profile);
  const yearsRetired = Math.max(0, profile.lifeExpectancy - profile.retirementAge);
  const initialRetirementBalance = proj.rows.find((r) => r.retired)?.startBalance ?? 0;
  const withdrawalRate =
    initialRetirementBalance > 0 ? profile.retirementExpenses / initialRetirementBalance : 1;

  const equityWeight =
    (profile.allocation.usStocks +
      profile.allocation.intlStocks +
      profile.allocation.realEstate +
      profile.allocation.crypto) /
    100;

  const scores: Omit<RiskScore, "level">[] = [
    {
      id: "sequence",
      label: "Sequence-of-returns",
      score: clamp(equityWeight * 100 * (withdrawalRate / 0.04)),
      description:
        "A bad first decade in retirement is the single biggest threat to a successful plan. Lower with a bond tent near retirement.",
    },
    {
      id: "inflation",
      label: "Inflation",
      score: clamp((1 - equityWeight) * 100 + (profile.inflation > 0.04 ? 20 : 0)),
      description:
        "Long retirements amplify inflation. Stocks and real assets are the strongest long-term hedge.",
    },
    {
      id: "longevity",
      label: "Longevity",
      score: clamp((yearsRetired / 60) * 100),
      description:
        "Living to 95+ is increasingly common. A 30+ year retirement raises the bar on sustainable withdrawal.",
    },
    {
      id: "market",
      label: "Market risk",
      score: clamp(stats.volatility * 100 * 3),
      description:
        "Your portfolio volatility. High vol means wider outcomes — both upside and depletion paths.",
    },
    {
      id: "withdrawal",
      label: "Withdrawal rate",
      score: clamp((withdrawalRate / 0.06) * 100),
      description: "Above ~4.5% historical safe withdrawal rate, depletion risk climbs sharply.",
    },
    {
      id: "concentration",
      label: "Concentration",
      score: clamp(stats.hhi * 100),
      description: "How much of your wealth sits in a single asset class.",
    },
    {
      id: "behavioral",
      label: "Behavioral",
      score: clamp(stats.volatility * 100 * 2.5),
      description: "High volatility tempts panic selling. A pre-committed glide path helps.",
    },
  ];

  return scores.map((s) => ({
    ...s,
    level: s.score < 33 ? "low" : s.score < 66 ? "medium" : "high",
  }));
}

function clamp(x: number) {
  return Math.max(0, Math.min(100, x));
}
