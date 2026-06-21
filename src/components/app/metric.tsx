import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "default" | "success" | "warning" | "info" | "sim";
  className?: string;
}

const accentBar: Record<NonNullable<Props["accent"]>, string> = {
  default: "bg-foreground/20",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  sim: "bg-sim",
};

export function Metric({ label, value, hint, accent = "default", className }: Props) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-2xl bg-surface px-5 py-4 hairline ring-soft transition-colors hover:bg-surface-2",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", accentBar[accent])} />
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="font-mono text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
