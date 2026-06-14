"use client";

import { motion, type Variants } from "framer-motion";
import { AgentsHeader } from "@/components/agents/AgentsHeader";
import { AgentsKpis } from "@/components/agents/AgentsKpis";
import { AgentsActions } from "@/components/agents/AgentsActions";
import { AgentRegistryPanel } from "@/components/agents/AgentRegistryPanel";
import { AgentRunsPanel } from "@/components/agents/AgentRunsPanel";
import { FindingsPanel } from "@/components/agents/FindingsPanel";
import { HumanReviewPanel } from "@/components/agents/HumanReviewPanel";
import { AgentCoveragePanel } from "@/components/agents/AgentCoveragePanel";
import { useAgents } from "@/lib/hooks/useAgents";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AgentsPage() {
  const data = useAgents();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AgentsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <AgentsKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <AgentsActions />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AgentRegistryPanel data={data} />
        <AgentRunsPanel data={data} />
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FindingsPanel data={data} />
        <HumanReviewPanel data={data} />
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <AgentCoveragePanel data={data} />
      </motion.div>
    </div>
  );
}
