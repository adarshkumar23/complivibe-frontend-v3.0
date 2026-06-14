"use client";

import { motion, type Variants } from "framer-motion";
import { WorkflowsHeader } from "@/components/workflows/WorkflowsHeader";
import { WorkflowsKpis } from "@/components/workflows/WorkflowsKpis";
import { WorkflowsTable } from "@/components/workflows/WorkflowsTable";
import { WorkflowStageTimeline } from "@/components/workflows/WorkflowStageTimeline";
import { WorkflowBlockers } from "@/components/workflows/WorkflowBlockers";
import { LinkedGovernanceWork } from "@/components/workflows/LinkedGovernanceWork";
import { useWorkflows } from "@/lib/hooks/useWorkflows";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function WorkflowsPage() {
  const data = useWorkflows();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <WorkflowsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <WorkflowsKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkflowsTable data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <WorkflowStageTimeline data={data} />
          <WorkflowBlockers data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <LinkedGovernanceWork data={data} />
      </motion.div>
    </div>
  );
}
