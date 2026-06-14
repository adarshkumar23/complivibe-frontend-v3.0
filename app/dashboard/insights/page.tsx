"use client";

import { motion, type Variants } from "framer-motion";
import { InsightsHeader } from "@/components/insights/InsightsHeader";
import { InsightsKpis } from "@/components/insights/InsightsKpis";
import { InsightFeed } from "@/components/insights/InsightFeed";
import { InsightSourceMap } from "@/components/insights/InsightSourceMap";
import { RecommendedActions } from "@/components/insights/RecommendedActions";
import { PriorityMatrix } from "@/components/insights/PriorityMatrix";
import { useProactiveInsights } from "@/lib/hooks/useProactiveInsights";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function InsightsPage() {
  const data = useProactiveInsights();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <InsightsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <InsightsKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InsightFeed data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <PriorityMatrix data={data} />
          <RecommendedActions data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <InsightSourceMap data={data} />
      </motion.div>
    </div>
  );
}
