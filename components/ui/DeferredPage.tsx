"use client";

import { motion } from "framer-motion";
import { Construction, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Honest placeholder for pages deferred to Phase B. Used instead of
 * fabricating data: it states whether a real backend exists for the area
 * and what will happen next. Never renders synthetic business values.
 */
export function DeferredPage({
  icon: Icon,
  kicker,
  title,
  backendState
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  /** One honest sentence about the backend reality for this area. */
  backendState: string;
}) {
  return (
    <div className="space-y-7">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <Icon size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">{kicker}</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">{title}</h1>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut", delay: 0.06 }}>
        <SectionCard title="Rebuild scheduled for Phase B" subtitle="Verified against the live API schema" icon={Construction} accent="amber">
          <EmptyState icon={Construction} title="This page is queued for the Phase B rebuild" description={backendState} />
        </SectionCard>
      </motion.div>
    </div>
  );
}
