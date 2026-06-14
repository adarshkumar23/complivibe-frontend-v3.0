"use client";

import { Play, Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAgentRuns, runStatusTone } from "@/lib/api/agent-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AgentsData } from "@/lib/hooks/useAgents";

export function AgentRunsPanel({ data }: { data: AgentsData }) {
  const { runs } = data;
  const list = runs.isSuccess ? normalizeAgentRuns(runs.data) : [];

  return (
    <SectionCard title="Agent Runs & Jobs" subtitle="Execution history" icon={Play} accent="teal" className="h-full">
      {runs.isLoading ? (
        <SkeletonRows rows={5} />
      ) : list.length === 0 ? (
        <EmptyState icon={Activity} title="Agent run data unavailable from backend." description="Run IDs, status, timing, and results will appear here once an agent runs or jobs endpoint is available." />
      ) : (
        <ul className="max-h-[440px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 18).map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{r.name}</p>
                <p className="truncate text-[11px] text-cv-slate">{[r.linkedResource, r.startedAt ? `Started ${formatRelativeTime(r.startedAt)}` : null, r.error].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              {r.status ? <StatusBadge label={r.status} tone={runStatusTone(r.status)} /> : r.result ? <StatusBadge label={r.result} tone="neutral" /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
