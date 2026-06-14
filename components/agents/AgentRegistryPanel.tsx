"use client";

import { Bot, Cpu } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAgents, agentStatusTone } from "@/lib/api/agent-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AgentsData } from "@/lib/hooks/useAgents";

/** Example agent archetypes — shown only as empty-state guidance, never as data rows. */
const EXAMPLES = ["Evidence Agent", "Risk Agent", "Regulatory Agent", "Questionnaire Agent", "Audit Pack Agent", "Trust Center Agent", "Monitoring Agent"];

export function AgentRegistryPanel({ data }: { data: AgentsData }) {
  const { agents } = data;
  const list = agents.isSuccess ? normalizeAgents(agents.data) : [];

  return (
    <SectionCard title="Agent Registry" subtitle="Governance agents & status" icon={Bot} accent="blue" className="h-full">
      {agents.isLoading ? (
        <SkeletonRows rows={5} />
      ) : list.length === 0 ? (
        <div className="py-2">
          <EmptyState icon={Cpu} title="Agent registry unavailable from backend." description="Registered governance agents will appear here once the backend exposes them. Typical agent archetypes include:" />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((e) => (
              <span key={e} className="inline-flex items-center rounded-full bg-white/55 px-2.5 py-1 text-[11px] font-medium text-cv-mist ring-1 ring-white/60">{e}</span>
            ))}
          </div>
        </div>
      ) : (
        <ul className="max-h-[440px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 16).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3.5 py-2.5 ring-1 ring-white/70">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{a.name}</p>
                <p className="truncate text-[11px] text-cv-slate">{[a.type, a.owner, a.lastRun ? `Ran ${formatRelativeTime(a.lastRun)}` : null].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {a.findingsCount != null ? <span className="text-[11px] font-semibold text-cv-mist">{a.findingsCount} findings</span> : null}
                {a.status ? <StatusBadge label={a.status} tone={agentStatusTone(a.status)} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
