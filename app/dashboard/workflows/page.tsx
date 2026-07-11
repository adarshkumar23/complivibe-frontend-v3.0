"use client";

import { Network } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Network} kicker="Orchestration" title="Workflows" backendState="No workflow-engine endpoints exist in the live schema; automation rules cover part of this. Honest gap pending backend support." />;
}
