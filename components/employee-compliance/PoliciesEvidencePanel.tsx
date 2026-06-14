"use client";

import { ScrollText, FileText, FileCheck2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizePolicies, statusTone, normalizeEvidenceItems } from "@/lib/api/employee-compliance-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { EmployeeComplianceData } from "@/lib/hooks/useEmployeeCompliance";

export function PoliciesEvidencePanel({ data }: { data: EmployeeComplianceData }) {
  const { policies, evidence } = data;
  const list = normalizePolicies(policies.data);
  const evidenceCount = evidence.isSuccess ? normalizeEvidenceItems(evidence.data).length : null;

  return (
    <SectionCard
      title="Policies & Evidence"
      subtitle="Compliance material linked to people"
      icon={ScrollText}
      accent="green"
      className="h-full"
      action={evidenceCount != null ? <span className="inline-flex items-center gap-1.5 rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60"><FileCheck2 size={12} /> {evidenceCount} evidence</span> : null}
    >
      {policies.isLoading ? (
        <SkeletonRows rows={4} />
      ) : policies.isError ? (
        <EmptyState icon={FileText} title="Policies unavailable from backend." description="Governance policies will appear here once the backend provides them." />
      ) : list.length === 0 ? (
        <EmptyState icon={FileText} title="No policies returned" description="Policies and linked evidence will appear here once available." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 12).map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{p.name}</p>
                <p className="truncate text-[11px] text-cv-slate">{[p.framework || p.category, p.evidenceCount != null ? `${p.evidenceCount} evidence` : null, p.lastUpdated ? `Updated ${formatDate(p.lastUpdated)}` : null].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              {p.status ? <StatusBadge label={p.status} tone={statusTone(p.status)} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
