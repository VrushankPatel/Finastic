import type { Allocation, Profile, Scenario } from "./types";

export const ASSET_META: Record<
  keyof Allocation,
  { label: string; expectedReturn: number; volatility: number; color: string }
> = {
  usStocks: {
    label: "US Stocks",
    expectedReturn: 0.07,
    volatility: 0.18,
    color: "var(--color-success)",
  },
  intlStocks: {
    label: "Intl Stocks",
    expectedReturn: 0.065,
    volatility: 0.2,
    color: "var(--color-info)",
  },
  bonds: { label: "Bonds", expectedReturn: 0.03, volatility: 0.06, color: "var(--color-sim)" },
  cash: {
    label: "Cash",
    expectedReturn: 0.012,
    volatility: 0.005,
    color: "var(--color-muted-foreground)",
  },
  realEstate: {
    label: "Real Estate",
    expectedReturn: 0.05,
    volatility: 0.14,
    color: "var(--color-warning)",
  },
  gold: { label: "Gold", expectedReturn: 0.025, volatility: 0.16, color: "var(--color-chart-5)" },
  crypto: { label: "Crypto", expectedReturn: 0.12, volatility: 0.7, color: "oklch(0.72 0.18 20)" },
};

export const DEFAULT_ALLOCATION: Allocation = {
  usStocks: 55,
  intlStocks: 20,
  bonds: 15,
  cash: 5,
  realEstate: 5,
  gold: 0,
  crypto: 0,
};

export const DEMO_PROFILE: Profile = {
  name: "Demo",
  currentAge: 32,
  retirementAge: 55,
  lifeExpectancy: 92,
  currentSavings: 25_000,
  currentInvestments: 95_000,
  debt: 0,
  annualSalary: 120_000,
  salaryGrowth: 0.03,
  annualContributions: 36_000,
  annualExpenses: 60_000,
  retirementExpenses: 55_000,
  inflation: 0.025,
  expectedReturn: 0.07,
  expectedVolatility: 0.15,
  swr: 0.04,
  allocation: DEFAULT_ALLOCATION,
  socialSecurityAge: 67,
  socialSecurityMonthly: 2200,
  pensionAge: 65,
  pensionMonthly: 0,
  incomeStreams: [],
  lifeEvents: [],
};

export const INDIA_DEMO_PROFILE: Profile = {
  name: "India demo",
  currentAge: 30,
  retirementAge: 50,
  lifeExpectancy: 85,
  currentSavings: 1_000_000,
  currentInvestments: 2_000_000,
  debt: 0,
  annualSalary: 1_500_000,
  salaryGrowth: 0.08,
  annualContributions: 816_000,
  annualExpenses: 750_000,
  retirementExpenses: 900_000,
  inflation: 0.06,
  expectedReturn: 0.12,
  expectedVolatility: 0.18,
  swr: 0.035,
  allocation: {
    usStocks: 0,
    intlStocks: 70,
    bonds: 10,
    cash: 5,
    realEstate: 5,
    gold: 10,
    crypto: 0,
  },
  socialSecurityAge: 60,
  socialSecurityMonthly: 0,
  pensionAge: 60,
  pensionMonthly: 0,
  incomeStreams: [
    {
      id: "epf",
      label: "EPF",
      kind: "contribution",
      amount: 216_000,
      startAge: 30,
      endAge: 58,
      growth: 0.06,
    },
    {
      id: "ppf",
      label: "PPF",
      kind: "contribution",
      amount: 150_000,
      startAge: 30,
      endAge: 45,
      growth: 0.06,
    },
    {
      id: "nps",
      label: "NPS",
      kind: "contribution",
      amount: 120_000,
      startAge: 30,
      endAge: 60,
      growth: 0.06,
    },
  ],
  lifeEvents: [],
};

export const EMPTY_PROFILE: Profile = {
  ...DEMO_PROFILE,
  name: "Me",
  currentSavings: 0,
  currentInvestments: 0,
  annualSalary: 0,
  annualContributions: 0,
  annualExpenses: 0,
  retirementExpenses: 0,
  socialSecurityMonthly: 0,
};

export function makeScenario(name: string, profile: Profile): Scenario {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    pinned: false,
    createdAt: now,
    updatedAt: now,
    profile,
    notes: "",
  };
}
