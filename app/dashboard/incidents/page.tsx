"use client";

import { Siren } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Siren} kicker="Response" title="Incidents" backendState="Data incidents live at /data-observability/incidents and compliance issues at /compliance/issues; a unified incident view is queued for Phase B." />;
}
