"use client";

import { ListChecks, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeObligations } from "@/lib/api/compliance-normalizers";
import type { Compliance } from "@/lib/hooks/useCompliance";

const OPEN_STATES = ["open", "pending", "in_progress", "in progress", "overdue", "todo", "not_started", "active"];

function isOpen(status: string | null): boolean {
  if (!status) return true;
  const s = status.toLowerCase();
  if (["compliant", "complete", "completed", "closed", "met", "done", "satisfied"].some((x) => s.includes(x)))
    return false;
  return OPEN_STATES.some((x) => s.includes(x)) || true;
}

export function OpenObligations({ data }: { data: Compliance }) {
  const { obligations } = data;
  const all = normalizeObligations(obligations.data);
  const open = all.filter((o) => isOpen(o.status));
  const shown = open.slice(0, 5);

  return (
    <SectionCard
      title="Open Obligations"
      subtitle="Requirements awaiting action"
      icon={ListChecks}
      accent="amber"
      action={
        open.length > 0 ? (
          <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-600 ring-1 ring-amber-400/25">
            {open.length}
          </span>
        ) : null
      }
    >
      {obligations.isLoading ? (
        <SkeletonRows rows={4} />
      ) : obligations.isError ? (
        <ErrorState compact title="Unable to load obligations" onRetry={() => obligations.refetch()} />
      ) : shown.length === 0 ? (
        <EmptyState
          compact
          icon={CheckCircle2}
          title="No open obligations"
          description="All tracked obligations are satisfied or none have been registered yet."
        />
      ) : (
        <ul className="space-y-2.5">
          {shown.map((o) => (
            <li key={o.id} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-1 text-[13px] font-semibold text-cv-ink">{o.title}</p>
                {o.severity !== "info" ? (
                  <SeverityBadge severity={o.severity} />
                ) : o.status ? (
                  <StatusBadge label={o.status} tone="warn" />
                ) : null}
              </div>
              {o.framework ? <p className="mt-0.5 text-[11px] text-cv-slate">{o.framework}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
