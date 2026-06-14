"use client";

import { motion, type Variants } from "framer-motion";
import { SecurityHeader } from "@/components/security/SecurityHeader";
import { SecurityKpis } from "@/components/security/SecurityKpis";
import { AccessRbacPanel } from "@/components/security/AccessRbacPanel";
import { ApiKeysPanel } from "@/components/security/ApiKeysPanel";
import { AuditActivityPanel } from "@/components/security/AuditActivityPanel";
import { ProductionHealthPanel } from "@/components/security/ProductionHealthPanel";
import { SecurityGapsPanel } from "@/components/security/SecurityGapsPanel";
import { useSecurity } from "@/lib/hooks/useSecurity";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function SecurityPage() {
  const data = useSecurity();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <SecurityHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <SecurityKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AccessRbacPanel data={data} />
        <ApiKeysPanel data={data} />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AuditActivityPanel data={data} />
        </div>
        <div className="flex flex-col gap-4">
          <ProductionHealthPanel data={data} />
          <SecurityGapsPanel data={data} />
        </div>
      </motion.div>
    </div>
  );
}
