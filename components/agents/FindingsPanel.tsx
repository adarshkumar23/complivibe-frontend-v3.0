"use client";

import { Flag, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeFindings, severityTone } from "@/lib/api/agent-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AgentsData } from "@/lib/hooks/useAgents";

export function FindingsPanel({ data }: { data: AgentsData }) {
  const { findings, insights } = data;

  const hasReal = findings.isSuccess && normalizeFindings(findings.data).length > 0;
  const derived = !hasReal && insights.isSuccess;
  const list = hasReal ? normalizeFindings(findings.data) : derived ? normalizeFindings(insights.data) : [];
  const loading = findings.isLoading || (!findings.isSuccess && insights.isLoading);

  return (
    <SectionCard
      title="Findings"
      subtitle={derived ? "Derived from available intelligence records" : "Agent-generated findings"}
      icon={Flag}
      accent="amber"
      className="h-full"
    >
      {loading ? (
        <SkeletonRows rows={5} />
      ) : list.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Findings unavailable from backend." description="Agent findings will appear here once a findings or intelligence endpoint is available." />
      ) : (
        <ul className="max-h-[440px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 18).map((f) => (
            <li key={f.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{f.title}</p>
                <p className="truncate text-[11px] text-cv-slate">{[f.source, f.linkedResource, formatRelativeTime(f.createdAt)].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {f.severity ? <StatusBadge label={f.severity} tone={severityTone(f.severity)} /> : null}
                {f.reviewStatus ? <StatusBadge label={f.reviewStatus} tone="neutral" /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
