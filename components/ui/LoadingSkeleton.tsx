import { cn } from "@/lib/utils/cn";

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("cv-shimmer rounded-xl", className)} />;
}

/** A few stacked skeleton lines matching list/row layouts. */
export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <LoadingSkeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-3 w-2/3" />
            <LoadingSkeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
