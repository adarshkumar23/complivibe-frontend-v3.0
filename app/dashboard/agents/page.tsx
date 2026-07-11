"use client";

import { Bot } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Bot} kicker="Automation Agents" title="Agents" backendState="Agent-run technical control results exist in the backend (/technical-control-results); the agent management view is queued for Phase B against that real surface." />;
}
