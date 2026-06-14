"use client";

import { motion, type Variants } from "framer-motion";
import { TrustGraphHeader } from "@/components/trust-graph/TrustGraphHeader";
import { TrustGraphKpis } from "@/components/trust-graph/TrustGraphKpis";
import { GraphExplorer } from "@/components/trust-graph/GraphExplorer";
import { RelationshipTable } from "@/components/trust-graph/RelationshipTable";
import { useTrustGraph } from "@/lib/hooks/useTrustGraph";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function TrustGraphPage() {
  const data = useTrustGraph();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <TrustGraphHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <TrustGraphKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <GraphExplorer data={data} />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <RelationshipTable data={data} />
      </motion.div>
    </div>
  );
}
