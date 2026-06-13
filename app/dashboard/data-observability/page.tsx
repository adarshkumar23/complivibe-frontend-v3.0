"use client";

import { motion, type Variants } from "framer-motion";
import { DataObsHeader } from "@/components/data-observability/DataObsHeader";
import { DataObsKpis } from "@/components/data-observability/DataObsKpis";
import { SourceOverview } from "@/components/data-observability/SourceOverview";
import { DataQuality } from "@/components/data-observability/DataQuality";
import { LineageMap } from "@/components/data-observability/LineageMap";
import { DataPriorityActions } from "@/components/data-observability/DataPriorityActions";
import { SchemaMonitoring } from "@/components/data-observability/SchemaMonitoring";
import { SensitiveSignals } from "@/components/data-observability/SensitiveSignals";
import { RecentDataEvents } from "@/components/data-observability/RecentDataEvents";
import { useDataObservability } from "@/lib/hooks/useDataObservability";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 }
  })
};

export default function DataObservabilityPage() {
  const data = useDataObservability();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <DataObsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <DataObsKpis data={data} />
      </motion.div>

      <motion.div
        variants={fade}
        custom={2}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <SourceOverview data={data} />
        </div>
        <div>
          <DataQuality data={data} />
        </div>
      </motion.div>

      <motion.div
        variants={fade}
        custom={3}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <LineageMap data={data} />
        </div>
        <div>
          <DataPriorityActions data={data} />
        </div>
      </motion.div>

      <motion.div
        variants={fade}
        custom={4}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <SchemaMonitoring data={data} />
        <SensitiveSignals data={data} />
        <RecentDataEvents data={data} />
      </motion.div>
    </div>
  );
}
