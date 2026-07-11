"use client";

import { Atom } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Atom} kicker="What-if" title="Scenario Simulation" backendState="No general scenario-simulation backend exists; only guardrail policy-resolution and reviewer-capacity simulations. Honest gap — needs a backend decision before rebuild." />;
}
