"use client";

import { Workflow } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Workflow} kicker="Data Governance" title="Data Lineage" backendState="Real lineage endpoints exist under /data-observability/lineage (OpenMetadata integration); queued for Phase B." />;
}
