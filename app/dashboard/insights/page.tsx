"use client";

import { Lightbulb } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Lightbulb} kicker="Intelligence" title="Proactive Insights" backendState="The old page targeted /intelligence endpoints that do not exist. Real nearest surfaces are /ai-governance/recommendations and /inbox; a redesign is queued for Phase B." />;
}
