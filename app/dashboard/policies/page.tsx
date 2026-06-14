"use client";

import { motion, type Variants } from "framer-motion";
import { PoliciesHeader } from "@/components/policies/PoliciesHeader";
import { PolicyKpis } from "@/components/policies/PolicyKpis";
import { PolicyLibrary } from "@/components/policies/PolicyLibrary";
import { PolicyFrameworkMapping } from "@/components/policies/PolicyFrameworkMapping";
import { PolicyTemplates } from "@/components/policies/PolicyTemplates";
import { usePolicies } from "@/lib/hooks/usePolicies";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function PoliciesPage() {
  const data = usePolicies();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <PoliciesHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <PolicyKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PolicyLibrary data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <PolicyFrameworkMapping data={data} />
          <PolicyTemplates data={data} />
        </div>
      </motion.div>
    </div>
  );
}
