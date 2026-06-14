"use client";

import { motion, type Variants } from "framer-motion";
import { AssuranceHeader } from "@/components/assurance/AssuranceHeader";
import { AssuranceKpis } from "@/components/assurance/AssuranceKpis";
import { AssuranceCasesTable } from "@/components/assurance/AssuranceCasesTable";
import { AssuranceSummaryPanel } from "@/components/assurance/AssuranceSummaryPanel";
import { ReviewerChecklist } from "@/components/assurance/ReviewerChecklist";
import { LinkedWorkPanel } from "@/components/assurance/LinkedWorkPanel";
import { useAssurance } from "@/lib/hooks/useAssurance";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AssurancePage() {
  const data = useAssurance();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AssuranceHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AssuranceKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssuranceCasesTable data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <AssuranceSummaryPanel data={data} />
          <ReviewerChecklist data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <LinkedWorkPanel data={data} />
      </motion.div>
    </div>
  );
}
