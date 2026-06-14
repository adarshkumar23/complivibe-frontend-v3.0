"use client";

import { motion, type Variants } from "framer-motion";
import { AlertsHeader } from "@/components/alerts/AlertsHeader";
import { AlertKpis } from "@/components/alerts/AlertKpis";
import { AlertFeed } from "@/components/alerts/AlertFeed";
import { SeverityBreakdown } from "@/components/alerts/SeverityBreakdown";
import { SourceBreakdown } from "@/components/alerts/SourceBreakdown";
import { LinkedRisksIncidents } from "@/components/alerts/LinkedRisksIncidents";
import { AlertDeadlines } from "@/components/alerts/AlertDeadlines";
import { RecentAlertActivity } from "@/components/alerts/RecentAlertActivity";
import { useAlerts } from "@/lib/hooks/useAlerts";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AlertsPage() {
  const data = useAlerts();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AlertsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AlertKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AlertFeed data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <SeverityBreakdown data={data} />
          <SourceBreakdown data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <LinkedRisksIncidents data={data} />
        <AlertDeadlines data={data} />
        <RecentAlertActivity data={data} />
      </motion.div>
    </div>
  );
}
