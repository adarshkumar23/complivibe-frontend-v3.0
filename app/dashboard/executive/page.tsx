"use client";

import { motion, type Variants } from "framer-motion";
import { ExecutiveHeader } from "@/components/executive/ExecutiveHeader";
import { ExecutiveKpis } from "@/components/executive/ExecutiveKpis";
import { TopExecutiveRisks } from "@/components/executive/TopExecutiveRisks";
import { BoardSummaryCards } from "@/components/executive/BoardSummaryCards";
import { UpcomingDeadlines } from "@/components/executive/UpcomingDeadlines";
import { useExecutiveSummary } from "@/lib/hooks/useExecutiveSummary";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function ExecutivePage() {
  const data = useExecutiveSummary();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <ExecutiveHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <ExecutiveKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TopExecutiveRisks data={data} />
        <BoardSummaryCards data={data} />
        <UpcomingDeadlines data={data} />
      </motion.div>
    </div>
  );
}
