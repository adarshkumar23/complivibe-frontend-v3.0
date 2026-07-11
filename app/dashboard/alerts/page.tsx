"use client";

import { Bell } from "lucide-react";
import { DeferredPage } from "@/components/ui/DeferredPage";

export default function Page() {
  return <DeferredPage icon={Bell} kicker="Continuous Monitoring" title="Alerts" backendState="Real monitoring endpoints exist (/compliance/monitoring/alerts, rules, summary); the alerts console is queued for Phase B." />;
}
