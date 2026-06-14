"use client";

import { FileSignature, FileText, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAcknowledgements, normalizePolicies, complianceStatusTone, statusTone } from "@/lib/api/employee-compliance-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { EmployeeComplianceData } from "@/lib/hooks/useEmployeeCompliance";

export function PolicyAcknowledgementPanel({ data }: { data: EmployeeComplianceData }) {
  const { acknowledgements, policies } = data;
  const router = useRouter();
  const acks = acknowledgements.isSuccess ? normalizeAcknowledgements(acknowledgements.data) : [];
  const hasAcks = acks.length > 0;

  // When acknowledgement records are unavailable, fall back to linked policies as compliance material
  // (NOT presented as completed acknowledgements).
  const policyList = !hasAcks ? normalizePolicies(policies.data) : [];

  return (
    <SectionCard
      title="Policy Acknowledgement"
      subtitle={hasAcks ? "Acknowledgement records" : "Linked policies (acknowledgements unavailable)"}
      icon={FileSignature}
      accent="green"
      className="h-full"
      action={<button type="button" onClick={() => router.push("/dashboard/policies")} className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">Policies <ArrowUpRight size={12} /></button>}
    >
      {acknowledgements.isLoading ? (
        <SkeletonRows rows={5} />
      ) : hasAcks ? (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {acks.slice(0, 14).map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{a.policy || "Policy"}</p>
                <p className="truncate text-[11px] text-cv-slate">{[a.member, a.acknowledgedDate ? `Signed ${formatDate(a.acknowledgedDate)}` : a.dueDate ? `Due ${formatDate(a.dueDate)}` : null].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              {a.status ? <StatusBadge label={a.status} tone={complianceStatusTone(a.status)} /> : null}
            </li>
          ))}
        </ul>
      ) : policyList.length > 0 ? (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {policyList.slice(0, 12).map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{p.name}</p>
                <p className="truncate text-[11px] text-cv-slate">{p.framework || p.category || "Linked policy"}</p>
              </div>
              {p.status ? <StatusBadge label={p.status} tone={statusTone(p.status)} /> : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={FileText} title="Acknowledgement data unavailable from backend." description="Per-employee policy acknowledgement records will appear here once the backend exposes them." />
      )}
    </SectionCard>
  );
}
