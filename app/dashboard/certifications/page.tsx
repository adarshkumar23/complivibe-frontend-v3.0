"use client";

import { motion, type Variants } from "framer-motion";
import { CertificationsHeader } from "@/components/certifications/CertificationsHeader";
import { CertificationKpis } from "@/components/certifications/CertificationKpis";
import { CertificationsGrid } from "@/components/certifications/CertificationsGrid";
import { ReadinessPanel } from "@/components/certifications/ReadinessPanel";
import { EvidenceRequirements } from "@/components/certifications/EvidenceRequirements";
import { useCertifications } from "@/lib/hooks/useCertifications";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function CertificationsPage() {
  const data = useCertifications();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <CertificationsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <CertificationKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CertificationsGrid data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <ReadinessPanel data={data} />
          <EvidenceRequirements data={data} />
        </div>
      </motion.div>
    </div>
  );
}
