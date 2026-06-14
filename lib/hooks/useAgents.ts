"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAgents, getAgentRuns, getAgentTasks, getAgentFindings,
  getProactiveInsights, getPredictiveAlerts, getApprovals, getAssuranceCases,
  getAiSystems, getEvidenceList, getRisks, getQuestionnaires
} from "@/lib/api/agents";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useAgents() {
  const agents = useEndpoint("agents-registry", getAgents);
  const runs = useEndpoint("agents-runs", getAgentRuns);
  const tasks = useEndpoint("agents-tasks", getAgentTasks);
  const findings = useEndpoint("agents-findings", getAgentFindings);

  const insights = useEndpoint("agents-insights", getProactiveInsights);
  const alerts = useEndpoint("agents-alerts", getPredictiveAlerts);
  const approvals = useEndpoint("agents-approvals", getApprovals);
  const assurance = useEndpoint("agents-assurance", getAssuranceCases);

  const aiSystems = useEndpoint("agents-ai-systems", getAiSystems);
  const evidence = useEndpoint("agents-evidence", getEvidenceList);
  const risks = useEndpoint("agents-risks", getRisks);
  const questionnaires = useEndpoint("agents-questionnaires", getQuestionnaires);

  return { agents, runs, tasks, findings, insights, alerts, approvals, assurance, aiSystems, evidence, risks, questionnaires };
}

export type AgentsData = ReturnType<typeof useAgents>;
