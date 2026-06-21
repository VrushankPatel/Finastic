import { motion } from "framer-motion";

interface Props {
  score: number;
  size?: number;
}

export function FiGauge({ score, size = 220 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (clamped / 100) * circumference * 0.75;
  const dashTotal = circumference * 0.75;

  const stroke =
    clamped < 33
      ? "var(--color-warning)"
      : clamped < 66
        ? "var(--color-info)"
        : "var(--color-success)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[225deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--hairline)"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dashTotal} ${circumference}`}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${arcLength} ${circumference}` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-5xl font-semibold tracking-tight text-foreground">
          {Math.round(clamped)}
        </div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          FI Score
        </div>
      </div>
    </div>
  );
}
