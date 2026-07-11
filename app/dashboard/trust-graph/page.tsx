"use client";

import { Share2 } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Share2} kicker="Relationships" title="Trust Graph" backendState="No org-wide graph endpoint exists; the backend offers per-risk dependency graphs only (/risks/{id}/graph). Needs backend support or a per-risk redesign in Phase B." />;
}
