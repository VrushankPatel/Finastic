import type { Profile } from "./types";

export interface YearRow {
  year: number;
  age: number;
  startBalance: number;
  contribution: number;
  income: number; // gross income that year (salary or retirement income, real)
  expenses: number; // real $
  withdrawal: number; // from portfolio, real $
  growth: number; // investment growth (real $)
  endBalance: number;
  netWorth: number; // endBalance - debtRemaining (we just track balance for now)
  inflationFactor: number; // nominal / real
  retired: boolean;
}

export interface ProjectionResult {
  rows: YearRow[];
  fiAge: number | null; // first age at which portfolio >= FI target
  fiTarget: number;
  depleted: boolean;
  depletionAge: number | null;
  terminalBalance: number;
}

/**
 * Deterministic real-terms projection. All monetary values returned are in
 * today's dollars; `inflationFactor` lets callers convert to nominal.
 */
export function project(profile: Profile, opts?: { realReturn?: number }): ProjectionResult {
  const {
    currentAge,
    retirementAge,
    lifeExpectancy,
    currentSavings,
    currentInvestments,
    annualSalary,
    salaryGrowth,
    annualContributions,
    annualExpenses,
    retirementExpenses,
    inflation,
    expectedReturn,
    swr,
    socialSecurityAge,
    socialSecurityMonthly,
    pensionAge,
    pensionMonthly,
    incomeStreams,
    lifeEvents,
  } = profile;

  const realReturn = opts?.realReturn ?? (1 + expectedReturn) / (1 + inflation) - 1;
  const fiTarget = retirementExpenses / Math.max(swr, 0.005);

  const rows: YearRow[] = [];
  let balance = currentSavings + currentInvestments;
  let salary = annualSalary;
  let contribution = annualContributions;
  let fiAge: number | null = null;
  let depletionAge: number | null = null;

  for (let age = currentAge; age <= lifeExpectancy; age++) {
    const year = new Date().getFullYear() + (age - currentAge);
    const yearsElapsed = age - currentAge;
    const inflationFactor = Math.pow(1 + inflation, yearsElapsed);
    const retired = age >= retirementAge;
    const startBalance = balance;

    // income (real $) — salary scales with real wage growth (already approximate)
    let income = retired ? 0 : salary;
    if (age >= socialSecurityAge) income += socialSecurityMonthly * 12;
    if (age >= pensionAge) income += pensionMonthly * 12;
    let streamContribution = 0;
    for (const s of incomeStreams) {
      if (age >= s.startAge && age <= s.endAge) {
        const dy = age - s.startAge;
        const streamAmount = s.amount * Math.pow(1 + (s.growth - inflation), dy);
        income += streamAmount;
        if (!retired && s.kind === "contribution") streamContribution += streamAmount;
      }
    }

    // events
    let eventCash = 0;
    for (const e of lifeEvents) {
      if (e.age === age) eventCash += e.amount;
    }

    const expenses = retired ? retirementExpenses : annualExpenses;
    const contrib = retired ? 0 : contribution + streamContribution;

    // cashflow surplus (or deficit) from non-portfolio income
    const nonPortfolioSurplus = income - expenses;
    // in accumulation: contribution adds to portfolio; in retirement: shortfall comes from portfolio
    let withdrawal = 0;
    if (retired) {
      const shortfall = expenses - income;
      withdrawal = Math.max(0, shortfall);
    }

    const adds = retired ? -withdrawal + eventCash : contrib + eventCash;
    // growth applies on average-balance approximation
    const growth = (startBalance + adds / 2) * realReturn;
    balance = startBalance + adds + growth;
    if (balance < 0) {
      if (depletionAge === null) depletionAge = age;
      balance = 0;
    }

    if (fiAge === null && balance >= fiTarget && !retired) fiAge = age;

    rows.push({
      year,
      age,
      startBalance,
      contribution: contrib,
      income,
      expenses,
      withdrawal,
      growth,
      endBalance: balance,
      netWorth: balance,
      inflationFactor,
      retired,
    });

    // step salary / contribution for next year (real)
    const realWageGrowth = (1 + salaryGrowth) / (1 + inflation) - 1;
    salary = salary * (1 + realWageGrowth);
    contribution = contribution * (1 + realWageGrowth);
    void nonPortfolioSurplus;
  }

  return {
    rows,
    fiAge,
    fiTarget,
    depleted: depletionAge !== null,
    depletionAge,
    terminalBalance: balance,
  };
}
