"use client";

import { motion, type Variants } from "framer-motion";
import { AiSystemsHeader } from "@/components/ai-systems/AiSystemsHeader";
import { AiSystemsKpis } from "@/components/ai-systems/AiSystemsKpis";
import { SystemsRegistry } from "@/components/ai-systems/SystemsRegistry";
import { GovernanceSummary } from "@/components/ai-systems/GovernanceSummary";
import { LifecycleStages } from "@/components/ai-systems/LifecycleStages";
import { RiskDistribution } from "@/components/ai-systems/RiskDistribution";
import { useAiSystems } from "@/lib/hooks/useAiSystems";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AiSystemsPage() {
  const data = useAiSystems();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AiSystemsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AiSystemsKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SystemsRegistry data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <RiskDistribution data={data} />
          <GovernanceSummary data={data} />
          <LifecycleStages data={data} />
        </div>
      </motion.div>
    </div>
  );
}
