import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
  compact = false
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card text-center",
        compact ? "py-6" : "py-10",
        className
      )}
    >
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cv-brand-soft ring-1 ring-white/60">
        <Icon size={22} className="text-cv-slate" strokeWidth={2} />
      </span>
      <p className="text-sm font-semibold text-cv-ink">{title}</p>
      {description ? <p className="mt-1 max-w-[34ch] text-xs leading-relaxed text-cv-slate">{description}</p> : null}
    </div>
  );
}
