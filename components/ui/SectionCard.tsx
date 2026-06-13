"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import type { Accent } from "@/components/ui/accent";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: Accent;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function SectionCard({
  title,
  subtitle,
  icon,
  accent = "blue",
  action,
  children,
  className,
  bodyClassName
}: SectionCardProps) {
  return (
    <GlassCard hover className={cn("flex flex-col p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? <IconTile icon={icon} accent={accent} size="sm" /> : null}
          <div>
            <h3 className="text-[15px] font-bold leading-tight text-cv-ink">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-xs text-cv-slate">{subtitle}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("mt-4 flex-1", bodyClassName)}>{children}</div>
    </GlassCard>
  );
}
