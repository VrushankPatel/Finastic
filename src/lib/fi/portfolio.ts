import { ASSET_META } from "./defaults";
import type { Allocation } from "./types";

export function normalizeAllocation(a: Allocation): Allocation {
  const total = Object.values(a).reduce((s, v) => s + v, 0);
  if (total <= 0) return a;
  const out = {} as Allocation;
  (Object.keys(a) as (keyof Allocation)[]).forEach((k) => {
    out[k] = (a[k] / total) * 100;
  });
  return out;
}

export function allocationStats(a: Allocation) {
  const norm = normalizeAllocation(a);
  let ret = 0;
  let varSum = 0;
  let hhi = 0;
  (Object.keys(norm) as (keyof Allocation)[]).forEach((k) => {
    const w = norm[k] / 100;
    const meta = ASSET_META[k];
    ret += w * meta.expectedReturn;
    varSum += (w * meta.volatility) ** 2;
    hhi += w * w;
  });
  // simplified weighted vol assuming zero correlation -> sqrt(sum (w*sigma)^2)
  // then we apply a 0.85 diversification factor for realism (cross-asset corr ~0.5)
  const vol = Math.sqrt(varSum) * 1.1;
  return {
    expectedReturn: ret,
    volatility: vol,
    hhi,
    diversification: 1 - hhi, // 1 = perfectly diversified
  };
}
