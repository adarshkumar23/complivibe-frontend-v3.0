"use client";

import { ScrollText, Download, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAuditLogs, auditOutcomeTone } from "@/lib/api/security-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { SecurityData } from "@/lib/hooks/useSecurity";

export function AuditActivityPanel({ data }: { data: SecurityData }) {
  const { auditLogs } = data;
  const events = normalizeAuditLogs(auditLogs.data);

  return (
    <SectionCard
      title="Audit Activity"
      subtitle="Security & access events"
      icon={ScrollText}
      accent="amber"
      action={
        <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
          <Download size={12} /> Export
        </button>
      }
    >
      {auditLogs.isLoading ? (
        <SkeletonRows rows={5} />
      ) : auditLogs.isError ? (
        <EmptyState icon={Activity} title="Audit activity unavailable from backend." description="Actor, action, resource, and outcome events will appear here once the audit-log endpoint is available." />
      ) : events.length === 0 ? (
        <EmptyState icon={Activity} title="No audit events" description="Security and access events will appear here once the backend records them." />
      ) : (
        <ul className="max-h-[440px] space-y-2.5 overflow-y-auto pr-1">
          {events.slice(0, 20).map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">
                  {[e.actor, e.action].filter(Boolean).join(" · ") || "Audit event"}
                </p>
                <p className="truncate text-[11px] text-cv-slate">{[e.resource, formatRelativeTime(e.timestamp)].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              {e.status ? <StatusBadge label={e.status} tone={auditOutcomeTone(e.status)} /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
