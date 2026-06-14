"use client";

import { Users } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeTeam } from "@/lib/api/settings-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { SettingsData } from "@/lib/hooks/useSettings";

function initials(name: string | null, email: string | null): string {
  const base = name || email || "?";
  return base.trim().slice(0, 2).toUpperCase();
}

export function TeamAccess({ data }: { data: SettingsData }) {
  const { team } = data;
  const members = normalizeTeam(team.data);

  return (
    <SectionCard
      title="Team & Access"
      subtitle="Workspace members & roles"
      icon={Users}
      accent="blue"
      className="h-full"
      action={team.isSuccess && members.length > 0 ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{members.length}</span> : null}
    >
      {team.isLoading ? (
        <SkeletonRows rows={5} />
      ) : team.isError ? (
        <ErrorState title="Unable to load team" onRetry={() => team.refetch()} />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No team members" description="Workspace members, roles, and access status will appear here once available." />
      ) : (
        <ul className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
          {members.slice(0, 12).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-2.5 ring-1 ring-white/70">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-xs font-bold text-white">
                  {initials(m.name, m.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{m.name || m.email || "Member"}</p>
                  <p className="truncate text-[11px] text-cv-slate">
                    {[m.email && m.name ? m.email : null, m.lastActive ? `Active ${formatRelativeTime(m.lastActive)}` : null].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {m.role ? <StatusBadge label={m.role} tone="purple" /> : null}
                {m.status ? <StatusBadge label={m.status} tone={/active|enabled/i.test(m.status) ? "good" : "neutral"} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
