"use client";

import { motion, type Variants } from "framer-motion";
import { AiMonitoringHeader } from "@/components/ai-monitoring/AiMonitoringHeader";
import { AiMonitoringKpis } from "@/components/ai-monitoring/AiMonitoringKpis";
import { MonitoringOverviewTable } from "@/components/ai-monitoring/MonitoringOverviewTable";
import { AlertsIncidentsFeed } from "@/components/ai-monitoring/AlertsIncidentsFeed";
import { SystemReliabilityPanel } from "@/components/ai-monitoring/SystemReliabilityPanel";
import { useAiMonitoring } from "@/lib/hooks/useAiMonitoring";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AiMonitoringPage() {
  const data = useAiMonitoring();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AiMonitoringHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AiMonitoringKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonitoringOverviewTable data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <AlertsIncidentsFeed data={data} />
          <SystemReliabilityPanel data={data} />
        </div>
      </motion.div>
    </div>
  );
}
