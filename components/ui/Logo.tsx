import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dim = size === "lg" ? "h-12 w-12 rounded-2xl" : size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl";
  const icon = size === "lg" ? 26 : size === "sm" ? 18 : 22;
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center bg-cv-brand text-white shadow-button",
        dim,
        className
      )}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/25 [mask-image:linear-gradient(to_bottom,white,transparent_55%)]" />
      <ShieldCheck size={icon} strokeWidth={2.4} className="relative" />
    </span>
  );
}
