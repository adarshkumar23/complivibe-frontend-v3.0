"use client";

import { motion, type Variants } from "framer-motion";
import { RegulatoryHeader } from "@/components/regulatory/RegulatoryHeader";
import { RegulatoryKpis } from "@/components/regulatory/RegulatoryKpis";
import { RegulatoryDeadlines } from "@/components/regulatory/RegulatoryDeadlines";
import { FrameworkCoverage } from "@/components/regulatory/FrameworkCoverage";
import { ObligationsTable } from "@/components/regulatory/ObligationsTable";
import { useRegulatory } from "@/lib/hooks/useRegulatory";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function RegulatoryPage() {
  const data = useRegulatory();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <RegulatoryHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <RegulatoryKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RegulatoryDeadlines data={data} />
        <FrameworkCoverage data={data} />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <ObligationsTable data={data} />
      </motion.div>
    </div>
  );
}
