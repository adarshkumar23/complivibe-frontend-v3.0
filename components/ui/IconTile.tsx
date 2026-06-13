import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ACCENTS, type Accent } from "@/components/ui/accent";

type IconTileProps = {
  icon: LucideIcon;
  accent?: Accent;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: { box: "h-9 w-9 rounded-xl", icon: 18 },
  md: { box: "h-11 w-11 rounded-2xl", icon: 21 },
  lg: { box: "h-14 w-14 rounded-2xl", icon: 26 }
};

export function IconTile({ icon: Icon, accent = "blue", size = "md", className }: IconTileProps) {
  const s = sizeMap[size];
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center bg-gradient-to-br text-white shadow-tile",
        ACCENTS[accent].tile,
        s.box,
        className
      )}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/25 [mask-image:linear-gradient(to_bottom,white,transparent_60%)]" />
      <Icon size={s.icon} strokeWidth={2.2} className="relative drop-shadow-sm" />
    </span>
  );
}
