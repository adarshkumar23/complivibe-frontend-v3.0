"use client";

import { motion, type Variants } from "framer-motion";
import { CompliancePageHeader } from "@/components/compliance/CompliancePageHeader";
import { ComplianceKpis } from "@/components/compliance/ComplianceKpis";
import { FrameworkReadiness } from "@/components/compliance/FrameworkReadiness";
import { PriorityActions } from "@/components/compliance/PriorityActions";
import { OpenObligations } from "@/components/compliance/OpenObligations";
import { ComplianceEvidenceFreshness } from "@/components/compliance/ComplianceEvidenceFreshness";
import { ComplianceDeadlines } from "@/components/compliance/ComplianceDeadlines";
import { RecentActivity } from "@/components/compliance/RecentActivity";
import { useCompliance } from "@/lib/hooks/useCompliance";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 }
  })
};

export default function CompliancePage() {
  const data = useCompliance();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <CompliancePageHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <ComplianceKpis data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={2}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <FrameworkReadiness data={data} />
        </div>
        <div>
          <PriorityActions data={data} />
        </div>
      </motion.div>

      <motion.div
        variants={fade}
        custom={3}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <OpenObligations data={data} />
        <ComplianceEvidenceFreshness data={data} />
        <ComplianceDeadlines data={data} />
        <RecentActivity data={data} />
      </motion.div>
    </div>
  );
}
