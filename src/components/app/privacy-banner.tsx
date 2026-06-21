import { Lock } from "lucide-react";

export function PrivacyBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full hairline bg-surface px-3 py-1 text-[11px] font-medium text-muted-foreground ${compact ? "" : "sm:text-xs"}`}
    >
      <Lock className="h-3 w-3 text-success" />
      Your financial data never leaves your device.
    </div>
  );
}
