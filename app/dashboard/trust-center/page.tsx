"use client";

import { motion, type Variants } from "framer-motion";
import { TrustCenterHeader } from "@/components/trust-center/TrustCenterHeader";
import { TrustKpis } from "@/components/trust-center/TrustKpis";
import { TrustOverview } from "@/components/trust-center/TrustOverview";
import { PublishedAssets } from "@/components/trust-center/PublishedAssets";
import { CertificationsPanel } from "@/components/trust-center/CertificationsPanel";
import { PublicReports } from "@/components/trust-center/PublicReports";
import { AiGovernanceSignals } from "@/components/trust-center/AiGovernanceSignals";
import { RecentTrustActivity } from "@/components/trust-center/RecentTrustActivity";
import { useTrustCenter } from "@/lib/hooks/useTrustCenter";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function TrustCenterPage() {
  const data = useTrustCenter();

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <TrustCenterHeader onPublished={() => { data.trust.refetch(); data.assets.refetch(); }} />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <TrustKpis data={data} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrustOverview data={data} />
        </div>
        <div>
          <AiGovernanceSignals data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PublishedAssets data={data} />
        </div>
        <div>
          <CertificationsPanel data={data} />
        </div>
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PublicReports data={data} />
        <RecentTrustActivity data={data} />
      </motion.div>
    </div>
  );
}
