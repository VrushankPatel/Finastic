import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, className, children }: Props) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl hairline bg-surface px-3 focus-within:ring-2 focus-within:ring-ring">
      {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none"
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  );
}
