"use client";

import { Layers, Flame, FolderOpen, ShieldCheck, Gauge, CalendarX } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import { normalizeRisks, isMitigated, isOverdue, averageRiskScore } from "@/lib/api/risk-normalizers";
import type { RisksData } from "@/lib/hooks/useRisks";

export function RiskKpis({ data }: { data: RisksData }) {
  const { risks, scores } = data;
  const list = normalizeRisks(risks.data);
  const ok = risks.isSuccess;
  const loading = risks.isLoading;

  const total = ok ? list.length : null;
  const highCritical = ok ? list.filter((r) => r.severity === "critical" || r.severity === "high").length : null;

  const anyStatus = list.some((r) => r.status);
  const open = ok && anyStatus ? list.filter((r) => r.status && !isMitigated(r.status)).length : null;
  const mitigated = ok && anyStatus ? list.filter((r) => isMitigated(r.status)).length : null;

  const avg =
    averageRiskScore(list) ?? pickScore([scores.data], ["risk_score", "avg_risk_score", "average_risk_score", "risk"]);

  const anyDue = list.some((r) => r.dueDate);
  const overdue = ok && anyDue ? list.filter((r) => isOverdue(r.dueDate)).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <RegistryKpi label="Total Risks" icon={Layers} accent="blue" value={total} caption={total != null ? "in register" : undefined} loading={loading} unavailableHint="Register unavailable" />
      <RegistryKpi label="High / Critical" icon={Flame} accent="red" value={highCritical} caption={highCritical != null ? "elevated severity" : undefined} loading={loading} unavailableHint="Register unavailable" />
      <RegistryKpi label="Open Risks" icon={FolderOpen} accent="amber" value={open} caption={open != null ? "not yet mitigated" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Mitigated Risks" icon={ShieldCheck} accent="green" value={mitigated} caption={mitigated != null ? "closed / treated" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Average Risk Score" icon={Gauge} accent="purple" value={avg} caption={avg != null ? "mean rating" : undefined} loading={loading && scores.isLoading} unavailableHint="No score returned" />
      <RegistryKpi label="Overdue Reviews" icon={CalendarX} accent="red" value={overdue} caption={overdue != null ? "past due date" : undefined} loading={loading} unavailableHint="No due dates" />
    </div>
  );
}
