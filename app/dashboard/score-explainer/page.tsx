"use client";

import { Calculator } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Calculator} kicker="Scoring" title="Score Explainer" backendState="Real scoring endpoints exist (/scoring/methodology, snapshots, trends, delta); the explainer will be rebuilt on them in Phase B." />;
}
