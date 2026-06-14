"use client";

import { motion, type Variants } from "framer-motion";
import { ApprovalsHeader } from "@/components/approvals/ApprovalsHeader";
import { ApprovalsKpis } from "@/components/approvals/ApprovalsKpis";
import { ApprovalQueueTable } from "@/components/approvals/ApprovalQueueTable";
import { ApprovalDecisionPanel } from "@/components/approvals/ApprovalDecisionPanel";
import { WorkflowDistribution } from "@/components/approvals/WorkflowDistribution";
import { useApprovals } from "@/lib/hooks/useApprovals";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function ApprovalsPage() {
  const data = useApprovals();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <ApprovalsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <ApprovalsKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ApprovalQueueTable data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <WorkflowDistribution data={data} />
          <ApprovalDecisionPanel data={data} />
        </div>
      </motion.div>
    </div>
  );
}
