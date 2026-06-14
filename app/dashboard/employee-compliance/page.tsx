"use client";

import { motion, type Variants } from "framer-motion";
import { EmployeeComplianceHeader } from "@/components/employee-compliance/EmployeeComplianceHeader";
import { EmployeeComplianceKpis } from "@/components/employee-compliance/EmployeeComplianceKpis";
import { EmployeeComplianceActions } from "@/components/employee-compliance/EmployeeComplianceActions";
import { EmployeeRosterPanel } from "@/components/employee-compliance/EmployeeRosterPanel";
import { PolicyAcknowledgementPanel } from "@/components/employee-compliance/PolicyAcknowledgementPanel";
import { TrainingAttestationPanel } from "@/components/employee-compliance/TrainingAttestationPanel";
import { OverdueActionsPanel } from "@/components/employee-compliance/OverdueActionsPanel";
import { PoliciesEvidencePanel } from "@/components/employee-compliance/PoliciesEvidencePanel";
import { useEmployeeCompliance } from "@/lib/hooks/useEmployeeCompliance";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function EmployeeCompliancePage() {
  const data = useEmployeeCompliance();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <EmployeeComplianceHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <EmployeeComplianceKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <EmployeeComplianceActions />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmployeeRosterPanel data={data} />
        </div>
        <div>
          <PolicyAcknowledgementPanel data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrainingAttestationPanel data={data} />
        <OverdueActionsPanel data={data} />
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <PoliciesEvidencePanel data={data} />
      </motion.div>
    </div>
  );
}
