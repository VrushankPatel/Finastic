import { useUIStore, CURRENCIES, type CurrencyCode } from "@/stores/ui";

function activeCurrency(): CurrencyCode {
  try {
    return useUIStore.getState().currency;
  } catch {
    return "USD";
  }
}

export const currency = (
  n: number,
  opts: { compact?: boolean; cents?: boolean; code?: CurrencyCode } = {},
) => {
  if (!Number.isFinite(n)) return "—";
  const { compact, cents, code } = opts;
  const ccy = code ?? activeCurrency();
  return new Intl.NumberFormat(CURRENCIES[ccy].locale, {
    style: "currency",
    currency: ccy,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: cents ? 2 : 0,
    minimumFractionDigits: cents ? 2 : 0,
  }).format(n);
};

export const percent = (n: number, digits = 1) => {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
};

export const number = (n: number, digits = 0) => {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
};

export const years = (n: number) => {
  if (!Number.isFinite(n)) return "—";
  if (n < 1) return `${Math.round(n * 12)} mo`;
  return `${n.toFixed(n < 10 ? 1 : 0)} yr`;
};
