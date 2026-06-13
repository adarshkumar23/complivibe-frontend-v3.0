import { RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ErrorState({
  title = "Something went wrong",
  description = "This section could not load. The backend may be temporarily unavailable.",
  onRetry,
  className,
  compact = false
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card text-center",
        compact ? "py-6" : "py-9",
        className
      )}
    >
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-400/25">
        <TriangleAlert size={22} className="text-rose-500" strokeWidth={2} />
      </span>
      <p className="text-sm font-semibold text-cv-ink">{title}</p>
      <p className="mt-1 max-w-[34ch] text-xs leading-relaxed text-cv-slate">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="cv-ring-focus mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
        >
          <RefreshCw size={14} strokeWidth={2.4} />
          Retry section
        </button>
      ) : null}
    </div>
  );
}
