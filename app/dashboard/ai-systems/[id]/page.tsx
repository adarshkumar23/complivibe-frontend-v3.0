"use client";

import { useParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { DetailHeader } from "@/components/ai-system-detail/DetailHeader";
import { DetailKpis } from "@/components/ai-system-detail/DetailKpis";
import { SystemProfile } from "@/components/ai-system-detail/SystemProfile";
import { ModelCardPanel } from "@/components/ai-system-detail/ModelCardPanel";
import { EvidencePanel } from "@/components/ai-system-detail/EvidencePanel";
import { TestingSummary } from "@/components/ai-system-detail/TestingSummary";
import { ViolationsPanel } from "@/components/ai-system-detail/ViolationsPanel";
import { TelemetryPanel } from "@/components/ai-system-detail/TelemetryPanel";
import { OversightPanel } from "@/components/ai-system-detail/OversightPanel";
import { LifecycleHistory } from "@/components/ai-system-detail/LifecycleHistory";
import { useAiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 }
  })
};

export default function AiSystemDetailPage() {
  const params = useParams();
  const raw = params?.id;
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null;
  const data = useAiSystemDetail(id);
  const systemId = id ?? "";

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <DetailHeader data={data} />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <DetailKpis data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={2}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <SystemProfile data={data} />
        <ModelCardPanel data={data} systemId={systemId} />
        <EvidencePanel data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={3}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <TestingSummary data={data} systemId={systemId} />
        <ViolationsPanel data={data} />
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show">
        <TelemetryPanel data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={5}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <OversightPanel data={data} />
        <LifecycleHistory data={data} />
      </motion.div>
    </div>
  );
}
