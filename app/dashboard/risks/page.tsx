"use client";

import { motion, type Variants } from "framer-motion";
import { RisksHeader } from "@/components/risks/RisksHeader";
import { RiskKpis } from "@/components/risks/RiskKpis";
import { RiskRegister } from "@/components/risks/RiskRegister";
import { RiskMatrix } from "@/components/risks/RiskMatrix";
import { PriorityRisks } from "@/components/risks/PriorityRisks";
import { RiskByCategory } from "@/components/risks/RiskByCategory";
import { LinkedEvidenceSystems } from "@/components/risks/LinkedEvidenceSystems";
import { MitigationActions } from "@/components/risks/MitigationActions";
import { RecentRiskActivity } from "@/components/risks/RecentRiskActivity";
import { useRisks } from "@/lib/hooks/useRisks";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 }
  })
};

export default function RisksPage() {
  const data = useRisks();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <RisksHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <RiskKpis data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={2}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <RiskRegister data={data} />
        </div>
        <div>
          <RiskMatrix data={data} />
        </div>
      </motion.div>

      <motion.div
        variants={fade}
        custom={3}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <PriorityRisks data={data} />
        <RiskByCategory data={data} />
        <LinkedEvidenceSystems data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={4}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <MitigationActions data={data} />
        <RecentRiskActivity data={data} />
      </motion.div>
    </div>
  );
}
