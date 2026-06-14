"use client";

import { useRouter } from "next/navigation";
import { TriangleAlert, ShieldCheck, ArrowUpRight } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { topExecutiveRisks } from "@/lib/api/executive-normalizers";
import { severityTone } from "@/lib/api/notification-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { ExecutiveSummaryData } from "@/lib/hooks/useExecutiveSummary";

export function TopExecutiveRisks({ data }: { data: ExecutiveSummaryData }) {
  const { risks, incidents } = data;
  const router = useRouter();
  const items = topExecutiveRisks(risks.data, incidents.data).slice(0, 8);

  const loading = risks.isLoading || incidents.isLoading;
  const errored = risks.isError && incidents.isError;

  return (
    <SectionCard title="Top Executive Risks" subtitle="Open risks & incidents by severity" icon={TriangleAlert} accent="red" className="h-full">
      {loading ? (
        <SkeletonRows rows={5} />
      ) : errored ? (
        <ErrorState compact title="Unable to load risks" onRetry={() => risks.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No open risks or incidents" description="Open risks and incidents will appear here once the backend reports them." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {items.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{r.title}</p>
                <p className="truncate text-[11px] text-cv-slate">
                  {[r.kind, r.linked, r.status, r.dueDate ? `Due ${formatDate(r.dueDate)}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.severity ? <StatusBadge label={r.severity} tone={severityTone(r.severity)} /> : null}
                <button type="button" onClick={() => router.push(r.route)} aria-label="Open" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cv-mist transition hover:bg-white/70 hover:text-cv-blue"><ArrowUpRight size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
