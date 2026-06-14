"use client";

import { motion, type Variants } from "framer-motion";
import { AiTestingHeader } from "@/components/ai-testing/AiTestingHeader";
import { AiTestingKpis } from "@/components/ai-testing/AiTestingKpis";
import { AiTestingTable } from "@/components/ai-testing/AiTestingTable";
import { ResponsibleAiChecks } from "@/components/ai-testing/ResponsibleAiChecks";
import { ViolationsFindings } from "@/components/ai-testing/ViolationsFindings";
import { useAiTesting } from "@/lib/hooks/useAiTesting";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AiTestingPage() {
  const data = useAiTesting();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AiTestingHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AiTestingKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AiTestingTable data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <ResponsibleAiChecks data={data} />
          <ViolationsFindings data={data} />
        </div>
      </motion.div>
    </div>
  );
}
