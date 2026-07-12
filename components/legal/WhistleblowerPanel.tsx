"use client";

import { useState } from "react";
import { Megaphone, Plus, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { WhistleblowerSubmitModal } from "@/components/legal/WhistleblowerSubmitModal";
import type { LegalData } from "@/lib/hooks/useLegal";

/** Anonymous reports from GET /api/v1/whistleblower/reports. */
export function WhistleblowerPanel({ data }: { data: LegalData }) {
  const { reports } = data;
  const list = reports.data ?? [];
  const open = list.filter((r) => r.status !== "resolved" && r.status !== "closed");
  const [submitOpen, setSubmitOpen] = useState(false);

  return (
    <SectionCard
      title="Whistleblower Reports"
      subtitle="Anonymous reports and investigations"
      icon={Megaphone}
      accent="amber"
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {open.length > 0 ? (
            <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-600 ring-1 ring-amber-400/25">
              {open.length} open
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-tile transition hover:opacity-90"
          >
            <Plus size={13} strokeWidth={2.6} />
            Submit report
          </button>
          <WhistleblowerSubmitModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
        </div>
      }
    >
      {reports.isLoading ? (
        <SkeletonRows rows={4} />
      ) : reports.isError ? (
        <ErrorState compact title="Unable to load reports" onRetry={() => reports.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          compact
          icon={ShieldCheck}
          title="No reports filed"
          description="Anonymous whistleblower submissions will appear here for investigation."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => (
            <li key={r.id} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">
                    {r.category ? r.category.replaceAll("_", " ") : "Report"}{" "}
                    <span className="font-medium text-cv-mist">#{r.anonymous_id ?? r.id.slice(0, 8)}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    {[
                      r.days_open != null ? `open ${r.days_open}d` : null,
                      r.assigned_investigator_user_id ? "investigator assigned" : "unassigned"
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <StatusBadge
                  label={r.status.replaceAll("_", " ")}
                  tone={r.status === "resolved" ? "good" : r.assigned_investigator_user_id ? "info" : "warn"}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
