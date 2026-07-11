"use client";

import { motion, type Variants } from "framer-motion";
import { ClipboardCheck, Construction } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

/**
 * Honest gap page: the current backend has no "assurance case" concept
 * (no /assurance endpoints exist in the live OpenAPI schema). Rather than
 * fabricate a view, this page states the gap. Closest real features:
 * audit engagements (Audit Pack) and governance reviews (Approvals).
 */
export default function AssurancePage() {
  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <ClipboardCheck size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Assurance</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
            Assurance Review
          </h1>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <SectionCard title="Not yet backed by the platform" subtitle="Verified against the live API schema" icon={Construction} accent="amber">
          <EmptyState
            icon={Construction}
            title="No assurance-case backend exists yet"
            description="The current backend exposes no assurance endpoints. Audit engagements live in Audit Pack, and governance review sign-offs live in Approvals. This page will activate when the backend ships an assurance model."
          />
        </SectionCard>
      </motion.div>
    </div>
  );
}
