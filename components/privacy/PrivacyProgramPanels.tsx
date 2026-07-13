"use client";

import { BookOpenCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PrivacyData } from "@/lib/hooks/usePrivacy";

function firstNumber(obj: Record<string, unknown> | undefined, keys: string[]): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number") return v;
  }
  return null;
}

/** Program registers: DPIA / DPA / RoPA / lawful basis, each from its own summary endpoint. */
export function PrivacyProgramPanels({ data }: { data: PrivacyData }) {
  const { dpias, dpas, ropa, lawfulBasis } = data;
  const loading = dpias.isLoading || dpas.isLoading || ropa.isLoading || lawfulBasis.isLoading;
  const errored = dpias.isError && dpas.isError && ropa.isError && lawfulBasis.isError;

  const rows = [
    { label: "DPIAs", value: firstNumber(dpias.data, ["total", "total_dpias", "total_records"]) },
    { label: "DPAs", value: firstNumber(dpas.data, ["total", "total_dpas", "total_records"]) },
    { label: "RoPA activities", value: firstNumber(ropa.data, ["total", "total_activities", "total_records"]) },
    {
      label: "Lawful basis records",
      value: firstNumber(lawfulBasis.data, ["total", "total_records", "total_activities_with_basis"])
    }
  ];

  return (
    <SectionCard title="Privacy Program Registers" subtitle="Assessments, agreements, and records" icon={BookOpenCheck} accent="purple">
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState
          compact
          title="Unable to load registers"
          onRetry={() => {
            dpias.refetch();
            dpas.refetch();
            ropa.refetch();
            lawfulBasis.refetch();
          }}
        />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <span className="text-[13px] font-semibold text-cv-ink">{r.label}</span>
              <StatusBadge label={r.value != null ? String(r.value) : "Unavailable"} tone={r.value ? "info" : "neutral"} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
