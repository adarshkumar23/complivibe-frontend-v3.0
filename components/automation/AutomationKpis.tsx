"use client";

import { Zap, RefreshCw, AlertTriangle, GitBranch } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeAutomationRules, normalizeAutomationRuns, isActive, runFailed, recordCount } from "@/lib/api/automation-normalizers";
import type { AutomationData } from "@/lib/hooks/useAutomation";

export function AutomationKpis({ data }: { data: AutomationData }) {
  const { rules, runs, syncLogs, deadlines, risks, incidents, questionnaires, evidence } = data;

  const ruleList = rules.isSuccess ? normalizeAutomationRules(rules.data) : null;
  const anyStatus = ruleList ? ruleList.some((r) => r.status) : false;
  const active = ruleList && anyStatus ? ruleList.filter(isActive).length : null;

  const runList = runs.isSuccess ? normalizeAutomationRuns(runs.data) : null;
  const recentRuns = runList ? runList.length : null;
  const anyResult = runList ? runList.some((r) => r.status || r.result) : false;
  const failedRuns = runList && anyResult ? runList.filter(runFailed).length : null;

  // Connected triggers = confirmed signal sources that returned real records.
  const sources = [syncLogs, deadlines, risks, incidents, questionnaires, evidence];
  const anySourceLoaded = sources.some((s) => s.isSuccess);
  const connectedTriggers = anySourceLoaded ? sources.filter((s) => s.isSuccess && recordCount(s.data) > 0).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Active Automations" icon={Zap} accent="green" value={active} caption={active != null ? "enabled rules" : undefined} loading={rules.isLoading} unavailableHint="Rules unavailable" />
      <RegistryKpi label="Recent Runs" icon={RefreshCw} accent="blue" value={recentRuns} caption={recentRuns != null ? "logged executions" : undefined} loading={runs.isLoading} unavailableHint="Runs unavailable" />
      <RegistryKpi label="Failed Runs" icon={AlertTriangle} accent="red" value={failedRuns} caption={failedRuns != null ? "need attention" : undefined} loading={runs.isLoading} unavailableHint="No run status" />
      <RegistryKpi label="Connected Triggers" icon={GitBranch} accent="purple" value={connectedTriggers} caption={connectedTriggers != null ? "live signal sources" : undefined} loading={syncLogs.isLoading} unavailableHint="Triggers unavailable" />
    </div>
  );
}
