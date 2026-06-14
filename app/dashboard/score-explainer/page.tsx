"use client";

import { motion, type Variants } from "framer-motion";
import { ScoreExplainerHeader } from "@/components/score-explainer/ScoreExplainerHeader";
import { ScoreExplainerKpis } from "@/components/score-explainer/ScoreExplainerKpis";
import { ScoreActions } from "@/components/score-explainer/ScoreActions";
import { ScoreBreakdown } from "@/components/score-explainer/ScoreBreakdown";
import { DriverList } from "@/components/score-explainer/DriverList";
import { EvidenceCoverageSection } from "@/components/score-explainer/EvidenceCoverageSection";
import { RiskImpactSection } from "@/components/score-explainer/RiskImpactSection";
import { AiSystemCoverage } from "@/components/score-explainer/AiSystemCoverage";
import { useScoreExplainer } from "@/lib/hooks/useScoreExplainer";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function ScoreExplainerPage() {
  const data = useScoreExplainer();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <ScoreExplainerHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <ScoreExplainerKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <ScoreActions />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ScoreBreakdown data={data} />
        <DriverList data={data} />
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EvidenceCoverageSection data={data} />
        <RiskImpactSection data={data} />
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <AiSystemCoverage data={data} />
      </motion.div>
    </div>
  );
}
