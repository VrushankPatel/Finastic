import { create } from "zustand";
import { DEMO_PROFILE, makeScenario } from "@/lib/fi/defaults";
import type { Profile, Scenario } from "@/lib/fi/types";
import {
  deleteScenario as dbDelete,
  getMeta,
  loadAllScenarios,
  saveScenario as dbSave,
  setMeta,
  snapshot,
  wipeAll,
} from "@/lib/storage/db";

interface PlannerState {
  hydrated: boolean;
  onboarded: boolean;
  scenarios: Scenario[];
  activeId: string | null;

  hydrate: () => Promise<void>;
  bootstrapDemo: () => Promise<void>;
  bootstrapProfile: (name: string, profile: Profile) => Promise<void>;
  setActive: (id: string) => void;
  updateActive: (mut: (p: Profile) => Profile) => Promise<void>;
  renameScenario: (id: string, name: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  duplicateScenario: (id: string) => Promise<void>;
  newScenario: (name?: string, profile?: Profile) => Promise<Scenario>;
  deleteScenarioById: (id: string) => Promise<void>;
  setOnboarded: (v: boolean) => Promise<void>;
  resetAll: () => Promise<void>;
  importScenarios: (data: Scenario[]) => Promise<void>;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  hydrated: false,
  onboarded: false,
  scenarios: [],
  activeId: null,

  async hydrate() {
    if (get().hydrated) return;
    const [scenarios, activeId, onboarded] = await Promise.all([
      loadAllScenarios(),
      getMeta<string>("activeId"),
      getMeta<boolean>("onboarded"),
    ]);
    set({
      hydrated: true,
      scenarios,
      activeId: activeId ?? scenarios[0]?.id ?? null,
      onboarded: !!onboarded,
    });
  },

  async bootstrapDemo() {
    const s = makeScenario("Demo plan", DEMO_PROFILE);
    await dbSave(s);
    await setMeta("activeId", s.id);
    await setMeta("onboarded", true);
    set({ scenarios: [s], activeId: s.id, onboarded: true });
  },

  async bootstrapProfile(name, profile) {
    const s = makeScenario(name, profile);
    await dbSave(s);
    await setMeta("activeId", s.id);
    await setMeta("onboarded", true);
    set({ scenarios: [s], activeId: s.id, onboarded: true });
  },

  setActive(id) {
    set({ activeId: id });
    void setMeta("activeId", id);
  },

  async updateActive(mut) {
    const { activeId, scenarios } = get();
    if (!activeId) return;
    const next = scenarios.map((s) =>
      s.id === activeId ? { ...s, profile: mut(s.profile), updatedAt: Date.now() } : s,
    );
    set({ scenarios: next });
    const active = next.find((s) => s.id === activeId)!;
    await dbSave(active);
    void snapshot("autosave", active);
  },

  async renameScenario(id, name) {
    const next = get().scenarios.map((s) =>
      s.id === id ? { ...s, name, updatedAt: Date.now() } : s,
    );
    set({ scenarios: next });
    const s = next.find((x) => x.id === id);
    if (s) await dbSave(s);
  },

  async togglePin(id) {
    const next = get().scenarios.map((s) =>
      s.id === id ? { ...s, pinned: !s.pinned, updatedAt: Date.now() } : s,
    );
    set({ scenarios: next });
    const s = next.find((x) => x.id === id);
    if (s) await dbSave(s);
  },

  async duplicateScenario(id) {
    const src = get().scenarios.find((s) => s.id === id);
    if (!src) return;
    const copy = makeScenario(`${src.name} (copy)`, src.profile);
    await dbSave(copy);
    set({ scenarios: [...get().scenarios, copy] });
  },

  async newScenario(name, profile) {
    const s = makeScenario(
      name ?? "New scenario",
      profile ?? get().scenarios.find((x) => x.id === get().activeId)?.profile ?? DEMO_PROFILE,
    );
    await dbSave(s);
    set({ scenarios: [...get().scenarios, s], activeId: s.id });
    void setMeta("activeId", s.id);
    return s;
  },

  async deleteScenarioById(id) {
    await dbDelete(id);
    const next = get().scenarios.filter((s) => s.id !== id);
    const newActive = get().activeId === id ? (next[0]?.id ?? null) : get().activeId;
    set({ scenarios: next, activeId: newActive });
    if (newActive) void setMeta("activeId", newActive);
  },

  async setOnboarded(v) {
    set({ onboarded: v });
    await setMeta("onboarded", v);
  },

  async resetAll() {
    await wipeAll();
    set({ scenarios: [], activeId: null, onboarded: false });
  },

  async importScenarios(data) {
    for (const s of data) await dbSave(s);
    const all = await loadAllScenarios();
    set({ scenarios: all, activeId: data[0]?.id ?? get().activeId });
  },
}));

export function activeScenario(state: PlannerState): Scenario | null {
  return state.scenarios.find((s) => s.id === state.activeId) ?? null;
}
