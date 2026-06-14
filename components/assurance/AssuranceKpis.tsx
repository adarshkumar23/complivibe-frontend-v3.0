"use client";

import { FolderCheck, PenLine, FileSearch, CheckCircle2 } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeAssuranceCases, normalizeAssuranceSummary, isComplete, isAwaitingSignoff } from "@/lib/api/assurance-normalizers";
import type { AssuranceData } from "@/lib/hooks/useAssurance";

export function AssuranceKpis({ data }: { data: AssuranceData }) {
  const { cases, summary } = data;
  const sum = normalizeAssuranceSummary(summary.data);
  const list = cases.isSuccess ? normalizeAssuranceCases(cases.data) : null;
  const loading = cases.isLoading || summary.isLoading;

  const anyStatus = list ? list.some((c) => c.status || c.signOffStatus) : false;
  const anyEvidence = list ? list.some((c) => c.evidenceCount != null) : false;

  // Prefer the real summary endpoint; otherwise derive from real case fields.
  const open = sum.openCases ?? (list && anyStatus ? list.filter((c) => !isComplete(c)).length : null);
  const awaiting = sum.awaitingSignoff ?? (list && anyStatus ? list.filter(isAwaitingSignoff).length : null);
  const evidence = sum.evidenceUnderReview ?? (list && anyEvidence ? list.reduce((s, c) => s + (c.evidenceCount ?? 0), 0) : null);
  const completed = sum.completed ?? (list && anyStatus ? list.filter(isComplete).length : null);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Open Assurance Cases" icon={FolderCheck} accent="blue" value={open} caption={open != null ? "in review" : undefined} loading={loading} unavailableHint="Cases unavailable" />
      <RegistryKpi label="Awaiting Sign-Off" icon={PenLine} accent="amber" value={awaiting} caption={awaiting != null ? "ready for decision" : undefined} loading={loading} unavailableHint="No status field" />
      <RegistryKpi label="Evidence Under Review" icon={FileSearch} accent="purple" value={evidence} caption={evidence != null ? "items" : undefined} loading={loading} unavailableHint="No evidence data" />
      <RegistryKpi label="Completed Reviews" icon={CheckCircle2} accent="green" value={completed} caption={completed != null ? "signed off" : undefined} loading={loading} unavailableHint="No status field" />
    </div>
  );
}
