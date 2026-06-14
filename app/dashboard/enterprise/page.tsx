"use client";

import { motion, type Variants } from "framer-motion";
import { EnterpriseHeader } from "@/components/enterprise/EnterpriseHeader";
import { EnterpriseKpis } from "@/components/enterprise/EnterpriseKpis";
import { EnterpriseActions } from "@/components/enterprise/EnterpriseActions";
import { OrgProfilePanel } from "@/components/enterprise/OrgProfilePanel";
import { TeamRbacPanel } from "@/components/enterprise/TeamRbacPanel";
import { ApiKeysAccessPanel } from "@/components/enterprise/ApiKeysAccessPanel";
import { ProductionReadinessPanel } from "@/components/enterprise/ProductionReadinessPanel";
import { EnterpriseControlsPanel } from "@/components/enterprise/EnterpriseControlsPanel";
import { useEnterpriseControl } from "@/lib/hooks/useEnterpriseControl";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function EnterprisePage() {
  const data = useEnterpriseControl();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <EnterpriseHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <EnterpriseKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <EnterpriseActions />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <OrgProfilePanel data={data} />
        </div>
        <div className="lg:col-span-2">
          <TeamRbacPanel data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ApiKeysAccessPanel data={data} />
        <ProductionReadinessPanel data={data} />
      </motion.div>

      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <EnterpriseControlsPanel data={data} />
      </motion.div>
    </div>
  );
}
