"use client";

import { useQuery } from "@tanstack/react-query";
import { getAutomationRules, getAutomationRuns, getAutomationStatus } from "@/lib/api/automation";
import { getSyncLogs } from "@/lib/api/integrations";
import { getPredictiveAlerts, getProactiveInsights, getRegulatoryDeadlines } from "@/lib/api/command";
import { getRisks, getComplianceEvidence } from "@/lib/api/compliance";
import { getIncidents } from "@/lib/api/incidents";
import { getQuestionnaires } from "@/lib/api/questionnaires";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useAutomation() {
  const rules = useEndpoint("automation-rules", getAutomationRules);
  const runs = useEndpoint("automation-runs", getAutomationRuns);
  const status = useEndpoint("automation-status", getAutomationStatus);

  // Confirmed signals used as real trigger sources.
  const syncLogs = useEndpoint("integration-sync-logs", getSyncLogs);
  const alerts = useEndpoint("predictive-alerts", getPredictiveAlerts);
  const insights = useEndpoint("proactive-insights", getProactiveInsights);
  const deadlines = useEndpoint("regulatory-deadlines", getRegulatoryDeadlines);
  const risks = useEndpoint("risks", getRisks);
  const incidents = useEndpoint("incidents", getIncidents);
  const questionnaires = useEndpoint("questionnaires", getQuestionnaires);
  const evidence = useEndpoint("cmp-evidence", getComplianceEvidence);

  return { rules, runs, status, syncLogs, alerts, insights, deadlines, risks, incidents, questionnaires, evidence };
}

export type AutomationData = ReturnType<typeof useAutomation>;
