"use client";

import { motion, type Variants } from "framer-motion";
import { PrivacyHeader } from "@/components/privacy/PrivacyHeader";
import { PrivacyKpis } from "@/components/privacy/PrivacyKpis";
import { PrivacyActions } from "@/components/privacy/PrivacyActions";
import { PrivacyReadinessPanel } from "@/components/privacy/PrivacyReadinessPanel";
import { DataMapPanel } from "@/components/privacy/DataMapPanel";
import { PrivacyRequestsPanel } from "@/components/privacy/PrivacyRequestsPanel";
import { PrivacyPoliciesEvidence } from "@/components/privacy/PrivacyPoliciesEvidence";
import { RegulatoryDeadlinePanel } from "@/components/privacy/RegulatoryDeadlinePanel";
import { usePrivacy } from "@/lib/hooks/usePrivacy";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function PrivacyPage() {
  const data = usePrivacy();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <PrivacyHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <PrivacyKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <PrivacyActions />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataMapPanel data={data} />
        </div>
        <div>
          <PrivacyReadinessPanel data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PrivacyRequestsPanel data={data} />
        <PrivacyPoliciesEvidence data={data} />
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <RegulatoryDeadlinePanel data={data} />
      </motion.div>
    </div>
  );
}
