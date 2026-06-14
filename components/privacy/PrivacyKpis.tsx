"use client";

import { Lock, FileCheck2, Database, ClipboardList } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { privacyScore, sensitiveSignals, normalizePrivacyRequests } from "@/lib/api/privacy-normalizers";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import { requestStatusTone } from "@/lib/api/privacy-normalizers";
import type { PrivacyData } from "@/lib/hooks/usePrivacy";

export function PrivacyKpis({ data }: { data: PrivacyData }) {
  const { summary, overview, evidence, sensitive, requests } = data;

  const readiness = privacyScore(summary.data, overview.data);

  const evidenceCount = evidence.isSuccess ? normalizeEvidenceItems(evidence.data).length : null;

  const sig = sensitive.isSuccess ? sensitiveSignals(sensitive.data) : null;
  const sigVals = sig ? [sig.pii, sig.exposure, sig.accessAnomalies, sig.retention].filter((v): v is number => v != null) : [];
  const sensitiveTotal = sig && sigVals.length > 0 ? sigVals.reduce((a, b) => a + b, 0) : null;

  const reqs = requests.isSuccess ? normalizePrivacyRequests(requests.data) : null;
  const openActions = reqs ? reqs.filter((r) => requestStatusTone(r.status) !== "good").length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Privacy Readiness" icon={Lock} accent="purple" value={readiness} suffix={readiness != null ? "/100" : ""} scoreToneFor={readiness} caption={readiness != null ? "backend score" : undefined} loading={summary.isLoading} unavailableHint="No score returned" />
      <RegistryKpi label="Evidence Records" icon={FileCheck2} accent="green" value={evidenceCount} caption={evidenceCount != null ? "available" : undefined} loading={evidence.isLoading} unavailableHint="Evidence unavailable" />
      <RegistryKpi label="Sensitive Data Signals" icon={Database} accent="amber" value={sensitiveTotal} caption={sensitiveTotal != null ? "flagged" : undefined} loading={sensitive.isLoading} unavailableHint="No signal data" />
      <RegistryKpi label="Open Privacy Actions" icon={ClipboardList} accent="red" value={openActions} caption={openActions != null ? "requests open" : undefined} loading={requests.isLoading} unavailableHint="Requests unavailable" />
    </div>
  );
}
