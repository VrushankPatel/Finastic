import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "dark" | "light";
type Lens = "real" | "nominal";
export type AccentId = "emerald" | "violet" | "sky" | "amber" | "rose";
export type CurrencyCode = "USD" | "INR";

export const ACCENTS: Record<
  AccentId,
  { label: string; swatch: string; oklch: { l: number; c: number; h: number } }
> = {
  emerald: {
    label: "Emerald",
    swatch: "oklch(0.78 0.16 158)",
    oklch: { l: 0.78, c: 0.16, h: 158 },
  },
  violet: { label: "Violet", swatch: "oklch(0.72 0.18 295)", oklch: { l: 0.72, c: 0.18, h: 295 } },
  sky: { label: "Sky", swatch: "oklch(0.74 0.16 235)", oklch: { l: 0.74, c: 0.16, h: 235 } },
  amber: { label: "Amber", swatch: "oklch(0.82 0.16 75)", oklch: { l: 0.82, c: 0.16, h: 75 } },
  rose: { label: "Rose", swatch: "oklch(0.72 0.20 15)", oklch: { l: 0.72, c: 0.2, h: 15 } },
};

export const CURRENCIES: Record<CurrencyCode, { label: string; symbol: string; locale: string }> = {
  USD: { label: "US Dollar", symbol: "$", locale: "en-US" },
  INR: { label: "Indian Rupee", symbol: "₹", locale: "en-IN" },
};

interface UIState {
  theme: Theme;
  lens: Lens;
  accent: AccentId;
  currency: CurrencyCode;
  paletteOpen: boolean;
  setTheme: (t: Theme) => void;
  setLens: (l: Lens) => void;
  setAccent: (a: AccentId) => void;
  setCurrency: (c: CurrencyCode) => void;
  setPaletteOpen: (v: boolean) => void;
}

function applyAccent(id: AccentId) {
  if (typeof document === "undefined") return;
  const { l, c, h } = ACCENTS[id].oklch;
  const root = document.documentElement;
  const primary = `oklch(${l} ${c} ${h})`;
  const ring = `oklch(${l} ${c} ${h} / 60%)`;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", ring);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", ring);
  root.style.setProperty("--chart-1", primary);
  root.style.setProperty("--success", primary);
  root.dataset.accent = id;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "dark",
      lens: "real",
      accent: "emerald",
      currency: "USD",
      paletteOpen: false,
      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("light", theme === "light");
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
        set({ theme });
      },
      setLens: (lens) => set({ lens }),
      setAccent: (accent) => {
        applyAccent(accent);
        set({ accent });
      },
      setCurrency: (currency) => set({ currency }),
      setPaletteOpen: (v) => set({ paletteOpen: v }),
    }),
    {
      name: "finastic.ui",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      partialize: (s) => ({ theme: s.theme, lens: s.lens, accent: s.accent, currency: s.currency }),
    },
  ),
);
