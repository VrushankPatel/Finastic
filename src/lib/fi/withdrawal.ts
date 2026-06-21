import type { Profile, WithdrawalStrategy } from "./types";

export interface WithdrawalResult {
  strategy: WithdrawalStrategy;
  label: string;
  description: string;
  initialWithdrawal: number; // first year retirement spend (real $)
  medianSpend: number;
  depletionRisk: number; // 0..1 rough heuristic
}

export function withdrawalStrategies(profile: Profile): WithdrawalResult[] {
  const portfolioAtRetirement =
    (profile.currentSavings + profile.currentInvestments) *
      Math.pow(
        (1 + profile.expectedReturn) / (1 + profile.inflation),
        Math.max(0, profile.retirementAge - profile.currentAge),
      ) +
    profile.annualContributions *
      ((Math.pow(
        (1 + profile.expectedReturn) / (1 + profile.inflation),
        Math.max(0, profile.retirementAge - profile.currentAge),
      ) -
        1) /
        Math.max(0.001, (1 + profile.expectedReturn) / (1 + profile.inflation) - 1));

  const baseExpense = profile.retirementExpenses;

  function vpwInitial() {
    const years = profile.lifeExpectancy - profile.retirementAge;
    const r = (1 + profile.expectedReturn) / (1 + profile.inflation) - 1;
    // annuity-style first-year withdrawal as fraction of balance
    const frac = r === 0 ? 1 / years : r / (1 - Math.pow(1 + r, -years));
    return portfolioAtRetirement * frac;
  }

  const strategies: WithdrawalResult[] = [
    {
      strategy: "fixed4",
      label: "4% Rule",
      description: "Withdraw 4% of portfolio at retirement, inflation-adjusted thereafter.",
      initialWithdrawal: portfolioAtRetirement * 0.04,
      medianSpend: portfolioAtRetirement * 0.04,
      depletionRisk: clampRisk(baseExpense / Math.max(1, portfolioAtRetirement * 0.04) - 1),
    },
    {
      strategy: "fixed3",
      label: "3% Rule",
      description: "Conservative — survives almost every historical sequence.",
      initialWithdrawal: portfolioAtRetirement * 0.03,
      medianSpend: portfolioAtRetirement * 0.03,
      depletionRisk: clampRisk(baseExpense / Math.max(1, portfolioAtRetirement * 0.03) - 1) * 0.5,
    },
    {
      strategy: "vpw",
      label: "Variable Percentage",
      description: "Withdraw a balance-dependent % that rises with age. Never depletes.",
      initialWithdrawal: vpwInitial(),
      medianSpend: vpwInitial(),
      depletionRisk: 0.02,
    },
    {
      strategy: "guardrails",
      label: "Guyton-Klinger Guardrails",
      description: "Start at 5%, cut spending after market drops, raise after gains.",
      initialWithdrawal: portfolioAtRetirement * 0.05,
      medianSpend: portfolioAtRetirement * 0.045,
      depletionRisk: clampRisk(baseExpense / Math.max(1, portfolioAtRetirement * 0.045) - 1) * 0.7,
    },
    {
      strategy: "custom",
      label: `Custom ${(profile.swr * 100).toFixed(1)}%`,
      description: "Your configured safe withdrawal rate.",
      initialWithdrawal: portfolioAtRetirement * profile.swr,
      medianSpend: portfolioAtRetirement * profile.swr,
      depletionRisk: clampRisk(baseExpense / Math.max(1, portfolioAtRetirement * profile.swr) - 1),
    },
  ];

  return strategies;
}

function clampRisk(x: number) {
  if (!Number.isFinite(x)) return 0.5;
  return Math.max(0, Math.min(1, x));
}
