"use client";

import { motion, type Variants } from "framer-motion";
import { VendorRiskHeader } from "@/components/vendor-risk/VendorRiskHeader";
import { VendorRiskKpis } from "@/components/vendor-risk/VendorRiskKpis";
import { VendorRiskTable } from "@/components/vendor-risk/VendorRiskTable";
import { VendorReviewPipeline } from "@/components/vendor-risk/VendorReviewPipeline";
import { VendorEvidenceLinkage } from "@/components/vendor-risk/VendorEvidenceLinkage";
import { useVendorRisk } from "@/lib/hooks/useVendorRisk";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function VendorRiskPage() {
  const data = useVendorRisk();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <VendorRiskHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <VendorRiskKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VendorRiskTable data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <VendorReviewPipeline data={data} />
          <VendorEvidenceLinkage data={data} />
        </div>
      </motion.div>
    </div>
  );
}
