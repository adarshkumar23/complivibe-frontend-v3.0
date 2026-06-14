"use client";

import { motion, type Variants } from "framer-motion";
import { SimulationHeader } from "@/components/simulation/SimulationHeader";
import { SimulationKpis } from "@/components/simulation/SimulationKpis";
import { SimulationActions } from "@/components/simulation/SimulationActions";
import { ScenarioBuilderPanel } from "@/components/simulation/ScenarioBuilderPanel";
import { SimulationResultsPanel } from "@/components/simulation/SimulationResultsPanel";
import { ImpactMapPanel } from "@/components/simulation/ImpactMapPanel";
import { HistoricalSimulationsPanel } from "@/components/simulation/HistoricalSimulationsPanel";
import { useSimulation } from "@/lib/hooks/useSimulation";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function SimulationPage() {
  const data = useSimulation();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <SimulationHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <SimulationKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <SimulationActions />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScenarioBuilderPanel data={data} />
        </div>
        <div>
          <ImpactMapPanel data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show">
        <SimulationResultsPanel data={data} />
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <HistoricalSimulationsPanel data={data} />
      </motion.div>
    </div>
  );
}
