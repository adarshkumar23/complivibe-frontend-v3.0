"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, BrainCircuit, Database, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Mode = {
  id: string;
  label: string;
  short: string;
  icon: LucideIcon;
  href: string;
};

const MODES: Mode[] = [
  { id: "compliance", label: "Compliance", short: "Comply", icon: ShieldCheck, href: "/dashboard/compliance" },
  { id: "ai-governance", label: "AI Governance", short: "AI Gov", icon: BrainCircuit, href: "/dashboard/ai-systems" },
  {
    id: "data-observability",
    label: "Data Observability",
    short: "Data",
    icon: Database,
    href: "/dashboard/data-observability"
  }
];

function activeMode(pathname: string | null): string {
  const path = pathname ?? "";
  if (path.includes("/compliance")) return "compliance";
  if (path.includes("/data-observability")) return "data-observability";
  return "ai-governance";
}

export function BottomModeSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeMode(pathname);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full cv-glass-strong p-1.5 shadow-glass">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = active === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => router.push(mode.href)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition sm:px-5",
                isActive ? "text-white" : "text-cv-slate hover:text-cv-ink"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="bottom-mode-active"
                  className="absolute inset-0 rounded-full bg-cv-brand shadow-button"
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                />
              ) : null}
              <Icon size={16} strokeWidth={2.3} className="relative shrink-0" />
              <span className="relative hidden whitespace-nowrap sm:inline">{mode.label}</span>
              <span className="relative whitespace-nowrap sm:hidden">{mode.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
