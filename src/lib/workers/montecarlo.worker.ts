/// <reference lib="webworker" />
import { makeRng, normal } from "../fi/rng";
import type { Profile } from "../fi/types";

const workerScope = self as DedicatedWorkerGlobalScope;

export interface MCRequest {
  type: "run";
  id: string;
  profile: Profile;
  paths: number; // 1000 / 5000 / 10000
  shock?: "none" | "dotcom2000" | "gfc2008" | "stagflation70s" | "lostDecade";
  fatTails?: boolean;
  seed?: number;
}

export interface MCProgress {
  type: "progress";
  id: string;
  done: number;
  total: number;
}

export interface MCResultMessage {
  type: "result";
  id: string;
  result: MCResult;
}

export interface MCResult {
  paths: number;
  successRate: number; // 0..1
  medianTerminal: number;
  bestTerminal: number;
  worstTerminal: number;
  depletionAges: number[];
  meanDepletionAge: number | null;
  // by-year stats (length = years simulated)
  ageAxis: number[];
  p10: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p90: number[];
}

function percentile(arr: number[], p: number) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}

function shockFor(kind: MCRequest["shock"]) {
  // multiplicative annual shocks applied to first N years of retirement
  switch (kind) {
    case "dotcom2000":
      return [-0.09, -0.12, -0.22, 0.28, 0.11];
    case "gfc2008":
      return [0.05, -0.37, 0.26, 0.15, 0.02];
    case "stagflation70s":
      return [-0.14, -0.26, 0.37, 0.23, -0.07];
    case "lostDecade":
      return [-0.05, -0.03, -0.06, 0.02, -0.04, 0.03, -0.07, 0.05, -0.02, 0.01];
    default:
      return null;
  }
}

function runOne(profile: Profile, rng: () => number, shocks: number[] | null, fatTails: boolean) {
  const years = profile.lifeExpectancy - profile.currentAge;
  const realMean = (1 + profile.expectedReturn) / (1 + profile.inflation) - 1;
  const vol = profile.expectedVolatility;
  let balance = profile.currentSavings + profile.currentInvestments;
  let salary = profile.annualSalary;
  let contribution = profile.annualContributions;
  let depletionAge: number | null = null;
  const path = new Array<number>(years + 1);
  path[0] = balance;

  for (let i = 0; i < years; i++) {
    const age = profile.currentAge + i;
    const retired = age >= profile.retirementAge;
    let r = normal(rng, realMean, vol);
    if (fatTails) {
      // mix with a heavier-tailed draw 15% of the time
      if (rng() < 0.15) r = normal(rng, realMean, vol * 2.2);
    }
    if (retired && shocks) {
      const j = age - profile.retirementAge;
      if (j < shocks.length) r = shocks[j];
    }

    let income = retired ? 0 : salary;
    if (age >= profile.socialSecurityAge) income += profile.socialSecurityMonthly * 12;
    if (age >= profile.pensionAge) income += profile.pensionMonthly * 12;
    let streamContribution = 0;
    for (const stream of profile.incomeStreams) {
      if (age >= stream.startAge && age <= stream.endAge) {
        const elapsed = age - stream.startAge;
        const streamAmount =
          stream.amount * Math.pow(1 + (stream.growth - profile.inflation), elapsed);
        income += streamAmount;
        if (!retired && stream.kind === "contribution") streamContribution += streamAmount;
      }
    }
    const expenses = retired ? profile.retirementExpenses : profile.annualExpenses;
    const withdrawal = retired ? Math.max(0, expenses - income) : 0;
    const adds = retired ? -withdrawal : contribution + streamContribution;

    balance = (balance + adds / 2) * (1 + r) + adds / 2;
    if (balance < 0) {
      if (depletionAge === null) depletionAge = age + 1;
      balance = 0;
    }
    path[i + 1] = balance;

    const realWageGrowth = (1 + profile.salaryGrowth) / (1 + profile.inflation) - 1;
    salary *= 1 + realWageGrowth;
    contribution *= 1 + realWageGrowth;
  }

  return { path, depletionAge, terminal: balance };
}

function run(req: MCRequest): MCResult {
  const seed = req.seed ?? 0xc0ffee;
  const rng = makeRng(seed);
  const years = req.profile.lifeExpectancy - req.profile.currentAge;
  const ageAxis = Array.from({ length: years + 1 }, (_, i) => req.profile.currentAge + i);
  const allPaths: number[][] = [];
  const depletionAges: number[] = [];
  const terminals: number[] = [];
  let successes = 0;

  const shocks = shockFor(req.shock);

  const progressEvery = Math.max(50, Math.floor(req.paths / 40));

  for (let i = 0; i < req.paths; i++) {
    const { path, depletionAge, terminal } = runOne(req.profile, rng, shocks, !!req.fatTails);
    allPaths.push(path);
    if (depletionAge === null) successes++;
    else depletionAges.push(depletionAge);
    terminals.push(terminal);

    if (i % progressEvery === 0) {
      const msg: MCProgress = { type: "progress", id: req.id, done: i, total: req.paths };
      workerScope.postMessage(msg);
    }
  }

  const p10: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p90: number[] = [];
  for (let t = 0; t <= years; t++) {
    const slice = new Array<number>(allPaths.length);
    for (let i = 0; i < allPaths.length; i++) slice[i] = allPaths[i][t];
    p10.push(percentile(slice, 10));
    p25.push(percentile(slice, 25));
    p50.push(percentile(slice, 50));
    p75.push(percentile(slice, 75));
    p90.push(percentile(slice, 90));
  }

  return {
    paths: req.paths,
    successRate: successes / req.paths,
    medianTerminal: percentile(terminals, 50),
    bestTerminal: percentile(terminals, 100),
    worstTerminal: percentile(terminals, 0),
    depletionAges,
    meanDepletionAge:
      depletionAges.length === 0
        ? null
        : depletionAges.reduce((a, b) => a + b, 0) / depletionAges.length,
    ageAxis,
    p10,
    p25,
    p50,
    p75,
    p90,
  };
}

self.onmessage = (e: MessageEvent<MCRequest>) => {
  if (e.data?.type !== "run") return;
  const result = run(e.data);
  const msg: MCResultMessage = { type: "result", id: e.data.id, result };
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg);
};

export {};
