"use client";

import { useState } from "react";
import { Scale, Gavel, Plus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { LegalMatterFormModal } from "@/components/legal/LegalMatterFormModal";
import { formatDate } from "@/lib/utils/format";
import type { LegalData } from "@/lib/hooks/useLegal";

/** Legal matters from GET /api/v1/legal-matters, with risk-escalation context. */
export function LegalMattersTable({ data }: { data: LegalData }) {
  const { matters } = data;
  const list = matters.data ?? [];
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <SectionCard
      title="Legal Matters"
      subtitle="Litigation, disputes, and regulatory matters"
      icon={Scale}
      accent="blue"
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {matters.isSuccess ? (
            <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
              {list.length} matters
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-tile transition hover:opacity-90"
          >
            <Plus size={13} strokeWidth={2.6} />
            New matter
          </button>
          <LegalMatterFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </div>
      }
    >
      {matters.isLoading ? (
        <SkeletonRows rows={5} />
      ) : matters.isError ? (
        <ErrorState title="Unable to load legal matters" onRetry={() => matters.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No legal matters"
          description="Open a matter to track litigation, counsel, budget, and linked risks."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((m) => (
            <li key={m.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">{m.title}</p>
                  <p className="mt-0.5 text-[11px] text-cv-slate">
                    {[
                      m.matter_type?.replaceAll("_", " "),
                      m.opposing_party ? `vs ${m.opposing_party}` : null,
                      m.opened_at ? `opened ${formatDate(m.opened_at) ?? m.opened_at}` : null,
                      m.linked_evidence_count ? `${m.linked_evidence_count} evidence` : null
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {m.risk_escalated_since_linked ? (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      Linked risk has escalated since this matter was opened.
                    </p>
                  ) : null}
                  {m.open_linked_issue_warning ? (
                    <p className="mt-1 text-[11px] font-medium text-amber-600">{m.open_linked_issue_warning}</p>
                  ) : null}
                </div>
                <StatusBadge
                  label={m.status.replaceAll("_", " ")}
                  tone={m.status === "closed" ? "neutral" : m.status === "open" ? "warn" : "info"}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
