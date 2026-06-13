"use client";

import { Files, ShieldCheck, Clock4, Link2, ClipboardCheck } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { pickScore } from "@/lib/hooks/useCommandCenter";
import {
  normalizeEvidenceItems,
  freshnessSummary,
  mappedControlsCount
} from "@/lib/api/evidence-normalizers";
import type { EvidenceData } from "@/lib/hooks/useEvidence";

export function EvidenceKpis({ data }: { data: EvidenceData }) {
  const { evidence, scores } = data;
  const items = normalizeEvidenceItems(evidence.data);
  const ok = evidence.isSuccess;
  const loading = evidence.isLoading;
  const summary = freshnessSummary(items);

  const total = ok ? items.length : null;
  const fresh = ok && summary.hasSignal ? summary.fresh : null;
  const expiring = ok && summary.hasSignal ? summary.expiring : null;
  const mapped = ok ? mappedControlsCount(items) : null;

  const auditFromScores = pickScore(
    [scores.data],
    ["audit_readiness", "audit_readiness_score", "audit_score", "audit", "readiness.audit"]
  );
  const auditDerived = summary.hasSignal && total && total > 0 ? Math.round((summary.fresh / total) * 100) : null;
  const audit = auditFromScores ?? auditDerived;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      <RegistryKpi
        label="Total Evidence"
        icon={Files}
        accent="blue"
        value={total}
        caption={total != null ? "items in vault" : undefined}
        loading={loading}
        unavailableHint="Vault unavailable"
      />
      <RegistryKpi
        label="Fresh Evidence"
        icon={ShieldCheck}
        accent="green"
        value={fresh}
        caption={fresh != null ? "currently valid" : undefined}
        loading={loading}
        unavailableHint="No freshness signal"
      />
      <RegistryKpi
        label="Expiring Evidence"
        icon={Clock4}
        accent="amber"
        value={expiring}
        caption={expiring != null ? "within 30 days" : undefined}
        loading={loading}
        unavailableHint="No freshness signal"
      />
      <RegistryKpi
        label="Mapped Controls"
        icon={Link2}
        accent="purple"
        value={mapped}
        caption={mapped != null ? "controls covered" : undefined}
        loading={loading}
        unavailableHint="No mappings"
      />
      <RegistryKpi
        label="Audit Readiness"
        icon={ClipboardCheck}
        accent="teal"
        value={audit}
        suffix={audit != null ? "/100" : ""}
        scoreToneFor={audit}
        caption={audit != null ? (auditFromScores != null ? "audit posture" : "share of fresh") : undefined}
        loading={loading && scores.isLoading}
        unavailableHint="No score returned"
      />
    </div>
  );
}
