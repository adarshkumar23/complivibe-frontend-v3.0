"use client";

import { Award } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Award} kicker="Attestation Programs" title="Certifications" backendState="Certification-program endpoints exist (/certification-programs); this view is queued for Phase B." />;
}
