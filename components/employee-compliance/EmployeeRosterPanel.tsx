"use client";

import { Users, UserPlus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRoster, complianceStatusTone } from "@/lib/api/employee-compliance-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { EmployeeComplianceData } from "@/lib/hooks/useEmployeeCompliance";

function initials(name: string | null, email: string | null): string {
  return (name || email || "?").trim().slice(0, 2).toUpperCase();
}

export function EmployeeRosterPanel({ data }: { data: EmployeeComplianceData }) {
  const { team } = data;
  const roster = normalizeRoster(team.data);
  const anyCompliance = roster.some((m) => m.complianceStatus);

  return (
    <SectionCard title="Employee Roster" subtitle="Members & compliance status" icon={Users} accent="blue" className="h-full">
      {team.isLoading ? (
        <SkeletonRows rows={6} />
      ) : team.isError ? (
        <ErrorState title="Roster unavailable" description="The team/members endpoint did not respond on this backend yet." onRetry={() => team.refetch()} />
      ) : roster.length === 0 ? (
        <EmptyState icon={UserPlus} title="No employees returned" description="Team members and their compliance status will appear here once the backend provides them." />
      ) : (
        <>
          {!anyCompliance ? <p className="mb-3 text-[11px] font-medium text-cv-mist">Compliance status unavailable from backend — showing roster only.</p> : null}
          <ul className="max-h-[440px] space-y-2.5 overflow-y-auto pr-1">
            {roster.slice(0, 18).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-2.5 ring-1 ring-white/70">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-xs font-bold text-white">{initials(m.name, m.email)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-cv-ink">{m.name || m.email || "Member"}</p>
                    <p className="truncate text-[11px] text-cv-slate">{[m.role, m.lastActivity ? `Active ${formatRelativeTime(m.lastActivity)}` : null].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {m.complianceStatus ? <StatusBadge label={m.complianceStatus} tone={complianceStatusTone(m.complianceStatus)} /> : m.status ? <StatusBadge label={m.status} tone={/active|enabled/i.test(m.status) ? "good" : "neutral"} /> : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  );
}
