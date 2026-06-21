import { z } from "zod";

export const AssetClassKey = z.enum([
  "usStocks",
  "intlStocks",
  "bonds",
  "cash",
  "realEstate",
  "gold",
  "crypto",
]);
export type AssetClassKey = z.infer<typeof AssetClassKey>;

export const AllocationSchema = z.object({
  usStocks: z.number().min(0).max(100),
  intlStocks: z.number().min(0).max(100),
  bonds: z.number().min(0).max(100),
  cash: z.number().min(0).max(100),
  realEstate: z.number().min(0).max(100),
  gold: z.number().min(0).max(100),
  crypto: z.number().min(0).max(100),
});
export type Allocation = z.infer<typeof AllocationSchema>;

export const IncomeStreamSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["contribution", "income"]).default("contribution"),
  amount: z.number().min(0),
  startAge: z.number().min(0).max(120),
  endAge: z.number().min(0).max(120),
  growth: z.number().min(-0.2).max(0.5).default(0.02),
});
export type IncomeStream = z.infer<typeof IncomeStreamSchema>;

export const LifeEventSchema = z.object({
  id: z.string(),
  label: z.string(),
  age: z.number().min(0).max(120),
  amount: z.number(), // positive = income/windfall, negative = expense
  kind: z.enum(["windfall", "expense", "milestone"]),
});
export type LifeEvent = z.infer<typeof LifeEventSchema>;

export const ProfileSchema = z
  .object({
    name: z.string().default("Me"),
    currentAge: z.number().min(15).max(99),
    retirementAge: z.number().min(20).max(99),
    lifeExpectancy: z.number().min(50).max(110),

    // wealth
    currentSavings: z.number().min(0),
    currentInvestments: z.number().min(0),
    debt: z.number().min(0).default(0),

    // cashflow
    annualSalary: z.number().min(0),
    salaryGrowth: z.number().min(-0.2).max(0.5).default(0.03),
    annualContributions: z.number().min(0), // own + employer
    annualExpenses: z.number().min(0),
    retirementExpenses: z.number().min(0), // today's $

    // market
    inflation: z.number().min(-0.05).max(0.25).default(0.025),
    expectedReturn: z.number().min(-0.1).max(0.3).default(0.07),
    expectedVolatility: z.number().min(0).max(1).default(0.15),
    swr: z.number().min(0.005).max(0.15).default(0.04),

    allocation: AllocationSchema,

    socialSecurityAge: z.number().min(50).max(80).default(67),
    socialSecurityMonthly: z.number().min(0).default(0),
    pensionAge: z.number().min(40).max(80).default(65),
    pensionMonthly: z.number().min(0).default(0),

    incomeStreams: z.array(IncomeStreamSchema).default([]),
    lifeEvents: z.array(LifeEventSchema).default([]),
  })
  .refine((p) => p.retirementAge > p.currentAge, {
    message: "Retirement age must be greater than current age",
    path: ["retirementAge"],
  })
  .refine((p) => p.lifeExpectancy > p.retirementAge, {
    message: "Life expectancy must exceed retirement age",
    path: ["lifeExpectancy"],
  });

export type Profile = z.infer<typeof ProfileSchema>;

export type FireVariant = "lean" | "traditional" | "fat" | "barista" | "coast" | "slow" | "custom";

export const ScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  pinned: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
  profile: ProfileSchema,
  notes: z.string().default(""),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export type WithdrawalStrategy = "fixed4" | "fixed3" | "vpw" | "guardrails" | "custom";
