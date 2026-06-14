"use client";

import { Bot, ListChecks, Flag, UserCheck } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import {
  normalizeAgents, normalizeAgentRuns, normalizeFindings, agentStatusTone,
  normalizeApprovals, isPending, normalizeAssuranceCases, assuranceComplete
} from "@/lib/api/agent-normalizers";
import type { AgentsData } from "@/lib/hooks/useAgents";

export function AgentsKpis({ data }: { data: AgentsData }) {
  const { agents, runs, tasks, findings, insights, approvals, assurance } = data;

  const agentList = agents.isSuccess ? normalizeAgents(agents.data) : null;
  const anyStatus = agentList ? agentList.some((a) => a.status) : false;
  const activeAgents = agentList ? (anyStatus ? agentList.filter((a) => a.status && agentStatusTone(a.status) === "good").length : agentList.length) : null;

  // Tasks processed: real tasks endpoint, else agent runs/jobs.
  const taskCount = tasks.isSuccess ? normalizeAgentRuns(tasks.data).length : runs.isSuccess ? normalizeAgentRuns(runs.data).length : null;

  // Findings: real findings endpoint, else derived from intelligence insights.
  const findingsCount = findings.isSuccess ? normalizeFindings(findings.data).length : insights.isSuccess ? normalizeFindings(insights.data).length : null;

  // Awaiting human review: pending approvals + assurance cases not complete.
  const pendingApprovals = approvals.isSuccess ? normalizeApprovals(approvals.data).filter(isPending).length : null;
  const openAssurance = assurance.isSuccess ? normalizeAssuranceCases(assurance.data).filter((c) => !assuranceComplete(c)).length : null;
  const awaiting = pendingApprovals == null && openAssurance == null ? null : (pendingApprovals ?? 0) + (openAssurance ?? 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Active Agents" icon={Bot} accent="blue" value={activeAgents} caption={activeAgents != null ? (anyStatus ? "active" : "registered") : undefined} loading={agents.isLoading} unavailableHint="Registry unavailable" />
      <RegistryKpi label="Tasks Processed" icon={ListChecks} accent="purple" value={taskCount} caption={taskCount != null ? "runs/jobs" : undefined} loading={runs.isLoading} unavailableHint="No run data" />
      <RegistryKpi label="Findings Created" icon={Flag} accent="amber" value={findingsCount} caption={findingsCount != null ? "findings" : undefined} loading={findings.isLoading} unavailableHint="No findings" />
      <RegistryKpi label="Awaiting Human Review" icon={UserCheck} accent="red" value={awaiting} caption={awaiting != null ? "pending" : undefined} loading={approvals.isLoading} unavailableHint="Queue unavailable" />
    </div>
  );
}
