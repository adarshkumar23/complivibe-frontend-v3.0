"use client";

import { ClipboardList } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={ClipboardList} kicker="Vendor Diligence" title="Questionnaires" backendState="Real endpoints exist (/compliance/questionnaire-templates, inbound-questionnaires with response-time metrics); queued for Phase B." />;
}
