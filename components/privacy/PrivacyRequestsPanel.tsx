"use client";

import { ClipboardList, Link2, FilePlus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizePrivacyRequests, requestStatusTone } from "@/lib/api/privacy-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { PrivacyData } from "@/lib/hooks/usePrivacy";

export function PrivacyRequestsPanel({ data }: { data: PrivacyData }) {
  const { requests, retention } = data;
  // Both privacy requests and retention items share the same shape.
  const items = [...normalizePrivacyRequests(requests.data), ...normalizePrivacyRequests(retention.data)];
  const loading = requests.isLoading && retention.isLoading;
  const bothUnavailable = requests.isError && retention.isError;

  return (
    <SectionCard
      title="Privacy Requests & Retention"
      subtitle="DSRs and retention actions"
      icon={ClipboardList}
      accent="blue"
      className="h-full"
      action={
        <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
          <FilePlus size={12} /> Create request
        </button>
      }
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : bothUnavailable || items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Privacy request data unavailable from backend." description="Data subject requests and retention actions will appear here once the backend provides them." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {items.slice(0, 14).map((r) => (
            <li key={r.id} className="rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{r.title}</p>
                  <p className="truncate text-[11px] text-cv-slate">
                    {[r.type, r.owner, r.dueDate ? `Due ${formatDate(r.dueDate)}` : null].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {r.status ? <StatusBadge label={r.status} tone={requestStatusTone(r.status)} /> : null}
              </div>
              {r.linked ? <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-cv-blue"><Link2 size={11} /> {r.linked}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
