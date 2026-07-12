"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { AuditPackHeader } from "@/components/audit-pack/AuditPackHeader";
import { AuditPackKpis } from "@/components/audit-pack/AuditPackKpis";
import { AuditPackLibrary } from "@/components/audit-pack/AuditPackLibrary";
import { EngagementWorkspace } from "@/components/audit-pack/EngagementWorkspace";
import { ReadinessChecklist } from "@/components/audit-pack/ReadinessChecklist";
import { useAuditPack } from "@/lib/hooks/useAuditPack";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AuditPackPage() {
  const data = useAuditPack();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedEngagement = (data.engagements.data ?? []).find((e) => e.id === selectedId) ?? null;

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AuditPackHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AuditPackKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AuditPackLibrary data={data} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div>
          <ReadinessChecklist data={data} />
        </div>
      </motion.div>

      {selectedEngagement ? (
        <motion.div variants={fade} custom={3} initial="hidden" animate="show">
          <EngagementWorkspace engagement={selectedEngagement} />
        </motion.div>
      ) : null}
    </div>
  );
}
