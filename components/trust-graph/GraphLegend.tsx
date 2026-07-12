import { cn } from "@/lib/utils/cn";

export function GraphLegend({ items }: { items: { label: string; swatchClass: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cv-slate">
          <span className={cn("h-2 w-2 rounded-full", item.swatchClass)} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
