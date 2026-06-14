"use client";

import { motion, type Variants } from "framer-motion";
import { IntegrationsHeader } from "@/components/integrations/IntegrationsHeader";
import { IntegrationsKpis } from "@/components/integrations/IntegrationsKpis";
import { ProviderStatusGrid } from "@/components/integrations/ProviderStatusGrid";
import { SyncLogsPanel } from "@/components/integrations/SyncLogsPanel";
import { useIntegrations } from "@/lib/hooks/useIntegrations";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function IntegrationsPage() {
  const data = useIntegrations();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <IntegrationsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <IntegrationsKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <ProviderStatusGrid data={data} />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <SyncLogsPanel data={data} />
      </motion.div>
    </div>
  );
}
