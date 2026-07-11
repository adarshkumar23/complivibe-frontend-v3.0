"use client";

import { FileCheck2, FileClock, FileX2, ShieldOff } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { EvidenceData } from "@/lib/hooks/useEvidence";

export function EvidenceKpis({ data }: { data: EvidenceData }) {
  const { readiness } = data;
  const r = readiness.data;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Evidence Items"
        icon={FileCheck2}
        accent="blue"
        value={r ? r.total_evidence_items : null}
        caption={r ? `${r.verified_evidence_items} verified` : undefined}
        loading={readiness.isLoading}
        unavailableHint="Readiness summary unavailable"
      />
      <RegistryKpi
        label="Needs Review"
        icon={FileClock}
        accent="amber"
        value={r ? r.needs_review_evidence_items : null}
        caption={
          r && r.needs_review_evidence_items > 0
            ? "unreviewed evidence doesn't count toward audit readiness"
            : r
              ? "review queue clear"
              : undefined
        }
        loading={readiness.isLoading}
        unavailableHint="Readiness summary unavailable"
      />
      <RegistryKpi
        label="Expired"
        icon={FileX2}
        accent="red"
        value={r ? r.expired_evidence_items : null}
        caption={r && r.expired_evidence_items > 0 ? "recollect before the next audit window" : undefined}
        loading={readiness.isLoading}
        unavailableHint="Readiness summary unavailable"
      />
      <RegistryKpi
        label="Controls Without Evidence"
        icon={ShieldOff}
        accent="purple"
        value={r ? r.controls_without_evidence : null}
        caption={
          r
            ? r.controls_with_verified_evidence > 0
              ? `${r.controls_with_verified_evidence} controls fully evidenced`
              : "no control has verified evidence yet"
            : undefined
        }
        loading={readiness.isLoading}
        unavailableHint="Readiness summary unavailable"
      />
    </div>
  );
}
