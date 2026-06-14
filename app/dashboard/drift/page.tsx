"use client";

import { motion, type Variants } from "framer-motion";
import { DriftHeader } from "@/components/drift/DriftHeader";
import { DriftKpis } from "@/components/drift/DriftKpis";
import { DriftOverviewTable } from "@/components/drift/DriftOverviewTable";
import { DriftSignalsPanel } from "@/components/drift/DriftSignalsPanel";
import { GovernanceImpact } from "@/components/drift/GovernanceImpact";
import { useDrift } from "@/lib/hooks/useDrift";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function DriftPage() {
  const data = useDrift();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <DriftHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <DriftKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DriftOverviewTable data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <DriftSignalsPanel data={data} />
          <GovernanceImpact data={data} />
        </div>
      </motion.div>
    </div>
  );
}
