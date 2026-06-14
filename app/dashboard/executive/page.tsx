"use client";

import { motion, type Variants } from "framer-motion";
import { ExecutiveHeader } from "@/components/executive/ExecutiveHeader";
import { ExecutiveKpis } from "@/components/executive/ExecutiveKpis";
import { ExecutiveActions } from "@/components/executive/ExecutiveActions";
import { ExecutiveBrief } from "@/components/executive/ExecutiveBrief";
import { ReadinessByArea } from "@/components/executive/ReadinessByArea";
import { TopExecutiveRisks } from "@/components/executive/TopExecutiveRisks";
import { UpcomingDeadlines } from "@/components/executive/UpcomingDeadlines";
import { BoardSummaryCards } from "@/components/executive/BoardSummaryCards";
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

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <ExecutiveActions />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExecutiveBrief data={data} />
        </div>
        <div>
          <ReadinessByArea data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopExecutiveRisks data={data} />
        <UpcomingDeadlines data={data} />
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <BoardSummaryCards data={data} />
      </motion.div>
    </div>
  );
}
