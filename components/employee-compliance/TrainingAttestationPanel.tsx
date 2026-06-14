"use client";

import { GraduationCap, ClipboardCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeComplianceTasks, complianceStatusTone } from "@/lib/api/employee-compliance-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { EmployeeComplianceData } from "@/lib/hooks/useEmployeeCompliance";

export function TrainingAttestationPanel({ data }: { data: EmployeeComplianceData }) {
  const { training, attestations } = data;
  const items = [
    ...(training.isSuccess ? normalizeComplianceTasks(training.data, "training").map((t) => ({ ...t, kind: "Training" })) : []),
    ...(attestations.isSuccess ? normalizeComplianceTasks(attestations.data, "attestation").map((t) => ({ ...t, kind: "Attestation" })) : [])
  ];
  const loading = training.isLoading && attestations.isLoading;
  const anySource = training.isSuccess || attestations.isSuccess;

  return (
    <SectionCard title="Training & Attestations" subtitle="Assigned learning & sign-offs" icon={GraduationCap} accent="purple" className="h-full">
      {loading ? (
        <SkeletonRows rows={5} />
      ) : !anySource ? (
        <EmptyState icon={ClipboardCheck} title="Training data unavailable from backend." description="Assigned training and attestations will appear here once the backend exposes them." />
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No training or attestations" description="No assigned training or attestation records were returned by the backend." />
      ) : (
        <ul className="max-h-[440px] space-y-2.5 overflow-y-auto pr-1">
          {items.slice(0, 20).map((t) => (
            <li key={`${t.kind}-${t.id}`} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{t.name}</p>
                <p className="truncate text-[11px] text-cv-slate">{[t.kind, t.assignee, t.completedDate ? `Completed ${formatDate(t.completedDate)}` : t.dueDate ? `Due ${formatDate(t.dueDate)}` : null].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              {t.status ? <StatusBadge label={t.status} tone={complianceStatusTone(t.status)} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
