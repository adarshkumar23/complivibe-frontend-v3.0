"use client";

import { motion, type Variants } from "framer-motion";
import { AlertTriangle, Bot, Inbox, Sparkles } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { InsightsHeader } from "@/components/insights/InsightsHeader";
import { InboxPanel } from "@/components/insights/InboxPanel";
import { RecommendationsPanel } from "@/components/insights/RecommendationsPanel";
import { SystemsCoveragePanel } from "@/components/insights/SystemsCoveragePanel";
import {
  useApplyRecommendation,
  useDismissRecommendation,
  useGenerateRecommendations,
  useInsights
} from "@/lib/hooks/useInsights";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function InsightsPage() {
  const { inbox, systems, recommendations } = useInsights();
  const applyMutation = useApplyRecommendation();
  const dismissMutation = useDismissRecommendation();
  const generateMutation = useGenerateRecommendations();

  const activeRecs = recommendations.data.filter((r) => r.status === "active");
  const criticalOrHigh = activeRecs.filter((r) => r.priority === "critical" || r.priority === "high").length;

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <InsightsHeader />
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <RegistryKpi
          label="Inbox Items"
          icon={Inbox}
          accent="blue"
          value={inbox.isSuccess ? inbox.data.total_items : null}
          caption={inbox.isSuccess && inbox.data.total_items === 0 ? "nothing overdue or assigned" : undefined}
          loading={inbox.isLoading}
          unavailableHint="Inbox unavailable"
        />
        <RegistryKpi
          label="Active Recommendations"
          icon={Sparkles}
          accent="purple"
          value={recommendations.isLoading ? null : activeRecs.length}
          loading={recommendations.isLoading}
          unavailableHint="Recommendations unavailable"
        />
        <RegistryKpi
          label="Critical / High Priority"
          icon={AlertTriangle}
          accent="red"
          value={recommendations.isLoading ? null : criticalOrHigh}
          caption={criticalOrHigh > 0 ? "needs attention now" : undefined}
          loading={recommendations.isLoading}
          unavailableHint="Recommendations unavailable"
        />
        <RegistryKpi
          label="AI Systems Monitored"
          icon={Bot}
          accent="teal"
          value={systems.isSuccess ? systems.data.length : null}
          loading={systems.isLoading}
          unavailableHint="AI systems unavailable"
        />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InboxPanel inbox={inbox} />
        <RecommendationsPanel
          recommendations={recommendations}
          applyMutation={applyMutation}
          dismissMutation={dismissMutation}
        />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <SystemsCoveragePanel systems={systems} recommendations={recommendations} generateMutation={generateMutation} />
      </motion.div>
    </div>
  );
}
