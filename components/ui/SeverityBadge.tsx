import { cn } from "@/lib/utils/cn";
import type { Severity } from "@/lib/api/types";

const styles: Record<Severity, { label: string; cls: string; dot: string }> = {
  critical: { label: "Critical", cls: "bg-rose-500/12 text-rose-600 ring-rose-500/20", dot: "bg-rose-500" },
  high: { label: "High", cls: "bg-orange-500/12 text-orange-600 ring-orange-500/20", dot: "bg-orange-500" },
  medium: { label: "Medium", cls: "bg-amber-400/15 text-amber-600 ring-amber-400/25", dot: "bg-amber-500" },
  low: { label: "Low", cls: "bg-emerald-500/12 text-emerald-600 ring-emerald-500/20", dot: "bg-emerald-500" },
  info: { label: "Info", cls: "bg-blue-500/12 text-blue-600 ring-blue-500/20", dot: "bg-blue-500" }
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const s = styles[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        s.cls,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
