"use client";

import { motion, type Variants } from "framer-motion";
import { EvidenceHeader } from "@/components/evidence/EvidenceHeader";
import { EvidenceKpis } from "@/components/evidence/EvidenceKpis";
import { EvidenceHealthBoard } from "@/components/evidence/EvidenceHealthBoard";
import { EvidenceTable } from "@/components/evidence/EvidenceTable";
import { EvidenceFreshnessPanel } from "@/components/evidence/EvidenceFreshnessPanel";
import { AuditReadinessByFramework } from "@/components/evidence/AuditReadinessByFramework";
import { RecentEvidenceEvents } from "@/components/evidence/RecentEvidenceEvents";
import { useEvidence } from "@/lib/hooks/useEvidence";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 }
  })
};

export default function EvidencePage() {
  const data = useEvidence();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <EvidenceHeader onUploaded={() => data.evidence.refetch()} />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <EvidenceKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <EvidenceHealthBoard data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={3}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <EvidenceTable data={data} />
        </div>
        <div>
          <EvidenceFreshnessPanel data={data} />
        </div>
      </motion.div>

      <motion.div
        variants={fade}
        custom={4}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <AuditReadinessByFramework data={data} />
        </div>
        <div>
          <RecentEvidenceEvents data={data} />
        </div>
      </motion.div>
    </div>
  );
}
