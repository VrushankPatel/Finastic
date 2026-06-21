import { motion } from "framer-motion";
import { Lock, PlayCircle, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { usePlannerStore } from "@/stores/planner";
import { EMPTY_PROFILE, INDIA_DEMO_PROFILE } from "@/lib/fi/defaults";
import { useUIStore } from "@/stores/ui";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const onboarded = usePlannerStore((s) => s.onboarded);
  const scenarios = usePlannerStore((s) => s.scenarios);
  const bootstrapDemo = usePlannerStore((s) => s.bootstrapDemo);
  const bootstrapProfile = usePlannerStore((s) => s.bootstrapProfile);
  const newScenario = usePlannerStore((s) => s.newScenario);
  const setOnboarded = usePlannerStore((s) => s.setOnboarded);
  const setCurrency = useUIStore((s) => s.setCurrency);

  if (onboarded && scenarios.length > 0) return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 pt-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full hairline bg-surface px-3 py-1 text-xs text-muted-foreground"
      >
        <Lock className="h-3.5 w-3.5 text-success" />
        Everything you enter stays on this device.
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.05 }}
        className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl"
      >
        Plan your financial independence.
        <span className="block text-muted-foreground">Privately. Locally. Precisely.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="max-w-xl text-balance text-sm text-muted-foreground"
      >
        A Monte-Carlo-backed planner with FIRE variants, withdrawal strategies, risk decomposition,
        and a life timeline — all running entirely in your browser.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <button
          onClick={() => void bootstrapDemo()}
          className="group flex h-auto flex-col items-start gap-2 rounded-2xl border border-success/40 bg-success/10 p-5 text-left transition-colors hover:bg-success/15"
        >
          <div className="flex items-center gap-2 text-success">
            <PlayCircle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Recommended</span>
          </div>
          <div className="text-base font-semibold">Try the demo plan</div>
          <p className="text-sm text-muted-foreground">
            Load a fully-populated profile to explore every screen instantly. You can edit anything.
          </p>
        </button>
        <button
          onClick={async () => {
            setCurrency("INR");
            await bootstrapProfile("India demo plan", INDIA_DEMO_PROFILE);
          }}
          className="group flex h-auto flex-col items-start gap-2 rounded-2xl hairline bg-surface p-5 text-left transition-colors hover:bg-surface-2"
        >
          <div className="flex items-center gap-2 text-info">
            <PlayCircle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">INR plan</span>
          </div>
          <div className="text-base font-semibold">Try India assumptions</div>
          <p className="text-sm text-muted-foreground">
            Explore rupee formatting, 3.5% withdrawal, and EPF/PPF/NPS-style contribution streams.
          </p>
        </button>
        <button
          onClick={async () => {
            await newScenario("My plan", EMPTY_PROFILE);
            await setOnboarded(true);
          }}
          className="group flex h-auto flex-col items-start gap-2 rounded-2xl hairline bg-surface p-5 text-left transition-colors hover:bg-surface-2"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plus className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">Start blank</span>
          </div>
          <div className="text-base font-semibold">Create my own plan</div>
          <p className="text-sm text-muted-foreground">
            Enter your numbers in the inputs screen. Autosaves as you type.
          </p>
        </button>
      </motion.div>
    </div>
  );
}
