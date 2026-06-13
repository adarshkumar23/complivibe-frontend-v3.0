"use client";

import { motion, type Variants } from "framer-motion";
import { AuditPackHeader } from "@/components/audit-pack/AuditPackHeader";
import { AuditPackKpis } from "@/components/audit-pack/AuditPackKpis";
import { AuditPackLibrary } from "@/components/audit-pack/AuditPackLibrary";
import { AuditPackBuilder } from "@/components/audit-pack/AuditPackBuilder";
import { ReadinessChecklist } from "@/components/audit-pack/ReadinessChecklist";
import { EvidenceBundle } from "@/components/audit-pack/EvidenceBundle";
import { ControlCoverage } from "@/components/audit-pack/ControlCoverage";
import { IssuesToResolve } from "@/components/audit-pack/IssuesToResolve";
import { RecentAuditPackActivity } from "@/components/audit-pack/RecentAuditPackActivity";
import { useAuditPack } from "@/lib/hooks/useAuditPack";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 }
  })
};

export default function AuditPackPage() {
  const data = useAuditPack();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AuditPackHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AuditPackKpis data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={2}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <AuditPackLibrary data={data} />
        </div>
        <div>
          <AuditPackBuilder data={data} onGenerated={() => data.packs.refetch()} />
        </div>
      </motion.div>

      <motion.div
        variants={fade}
        custom={3}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <ReadinessChecklist data={data} />
        <EvidenceBundle data={data} />
        <IssuesToResolve data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={4}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <ControlCoverage data={data} />
        </div>
        <div>
          <RecentAuditPackActivity data={data} />
        </div>
      </motion.div>
    </div>
  );
}
