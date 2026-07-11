"use client";

import { motion, type Variants } from "framer-motion";
import { AutomationHeader } from "@/components/automation/AutomationHeader";
import { AutomationKpis } from "@/components/automation/AutomationKpis";
import { AutomationRulesTable } from "@/components/automation/AutomationRulesTable";
import { AutomationRunHistory } from "@/components/automation/AutomationRunHistory";
import { useAutomation } from "@/lib/hooks/useAutomation";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AutomationPage() {
  const data = useAutomation();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AutomationHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AutomationKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AutomationRulesTable data={data} />
        </div>
        <div>
          <AutomationRunHistory data={data} />
        </div>
      </motion.div>
    </div>
  );
}
