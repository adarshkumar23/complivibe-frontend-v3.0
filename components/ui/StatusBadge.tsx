import { cn } from "@/lib/utils/cn";

type Tone = "good" | "warn" | "bad" | "info" | "neutral" | "purple" | "teal";

const toneStyles: Record<Tone, string> = {
  good: "bg-emerald-500/12 text-emerald-600 ring-emerald-500/20",
  warn: "bg-amber-400/15 text-amber-600 ring-amber-400/25",
  bad: "bg-rose-500/12 text-rose-600 ring-rose-500/20",
  info: "bg-blue-500/12 text-blue-600 ring-blue-500/20",
  purple: "bg-violet-500/12 text-violet-600 ring-violet-500/20",
  teal: "bg-teal-500/12 text-teal-600 ring-teal-500/20",
  neutral: "bg-slate-400/12 text-slate-500 ring-slate-400/20"
};

export function StatusBadge({
  label,
  tone = "neutral",
  className
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        toneStyles[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
