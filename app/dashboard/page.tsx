"use client";

import { motion, type Variants } from "framer-motion";
import { CommandHeader } from "@/components/dashboard/CommandHeader";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TrustOverview } from "@/components/dashboard/TrustOverview";
import { OpenAlerts } from "@/components/dashboard/OpenAlerts";
import { RegulatoryDeadlines } from "@/components/dashboard/RegulatoryDeadlines";
import { FrameworkReadiness } from "@/components/compliance/FrameworkReadiness";
import { useCommandCenter } from "@/lib/hooks/useCommandCenter";
import { useCompliance } from "@/lib/hooks/useCompliance";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function DashboardPage() {
  const data = useCommandCenter();
  const compliance = useCompliance();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <CommandHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <KpiRow data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <QuickActions />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrustOverview data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <OpenAlerts data={data} />
          <RegulatoryDeadlines data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show">
        <FrameworkReadiness data={compliance} />
      </motion.div>
    </div>
  );
}
