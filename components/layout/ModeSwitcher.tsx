"use client";

import { motion } from "framer-motion";
import { ShieldCheck, BrainCircuit, Database, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUiStore, type CommandMode } from "@/store/ui-store";

const MODES: { id: CommandMode; label: string; icon: LucideIcon }[] = [
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "ai-governance", label: "AI Governance", icon: BrainCircuit },
  { id: "data-observability", label: "Data Observability", icon: Database }
];

export function ModeSwitcher({ className }: { className?: string }) {
  const mode = useUiStore((s) => s.mode);
  const setMode = useUiStore((s) => s.setMode);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full cv-glass-strong p-1.5 shadow-glass",
        className
      )}
    >
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition sm:px-5",
              active ? "text-white" : "text-cv-slate hover:text-cv-ink"
            )}
          >
            {active ? (
              <motion.span
                layoutId="mode-active"
                className="absolute inset-0 rounded-full bg-cv-brand shadow-button"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            ) : null}
            <Icon size={16} strokeWidth={2.3} className="relative" />
            <span className="relative whitespace-nowrap">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
