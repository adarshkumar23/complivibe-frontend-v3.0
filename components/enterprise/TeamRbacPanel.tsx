"use client";

import { Users, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeTeam, roleDistribution } from "@/lib/api/enterprise-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { EnterpriseData } from "@/lib/hooks/useEnterpriseControl";

function initials(name: string | null, email: string | null): string {
  return (name || email || "?").trim().slice(0, 2).toUpperCase();
}

export function TeamRbacPanel({ data }: { data: EnterpriseData }) {
  const { team } = data;
  const members = normalizeTeam(team.data);
  const dist = roleDistribution(members);

  return (
    <SectionCard
      title="Team & RBAC"
      subtitle="Members, roles & access status"
      icon={Users}
      accent="purple"
      className="h-full"
      action={
        <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
          Change role
        </button>
      }
    >
      {team.isLoading ? (
        <SkeletonRows rows={5} />
      ) : team.isError ? (
        <ErrorState title="Team data unavailable" description="The team/members endpoint did not respond on this backend yet." onRetry={() => team.refetch()} />
      ) : members.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No members returned" description="Workspace members, roles, and access status will appear here once the backend provides them." />
      ) : (
        <>
          {dist.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {dist.map((r) => (
                <span key={r.role} className="inline-flex items-center gap-1.5 rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
                  {r.role} · {r.count}
                </span>
              ))}
            </div>
          ) : null}
          <ul className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
            {members.slice(0, 14).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-2.5 ring-1 ring-white/70">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-xs font-bold text-white">{initials(m.name, m.email)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-cv-ink">{m.name || m.email || "Member"}</p>
                    <p className="truncate text-[11px] text-cv-slate">{[m.email && m.name ? m.email : null, m.lastActive ? `Active ${formatRelativeTime(m.lastActive)}` : null].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {m.role ? <StatusBadge label={m.role} tone="purple" /> : null}
                  {m.status ? <StatusBadge label={m.status} tone={/active|enabled/i.test(m.status) ? "good" : "neutral"} /> : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  );
}
