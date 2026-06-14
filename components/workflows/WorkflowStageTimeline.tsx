"use client";

import { GitBranch } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeWorkflows, stageTone } from "@/lib/api/workflow-normalizers";
import type { WorkflowsData } from "@/lib/hooks/useWorkflows";

const toneBar = { good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", neutral: "bg-slate-400" } as const;

export function WorkflowStageTimeline({ data }: { data: WorkflowsData }) {
  const { workflows } = data;
  const list = normalizeWorkflows(workflows.data);

  // Aggregate real stage data across workflows; never synthesize a pipeline.
  const agg = new Map<string, { total: number; good: number; warn: number; bad: number }>();
  for (const w of list) {
    for (const st of w.stages) {
      const cur = agg.get(st.name) ?? { total: 0, good: 0, warn: 0, bad: 0 };
      cur.total += 1;
      const tone = stageTone(st.status);
      if (tone === "good") cur.good += 1;
      else if (tone === "warn") cur.warn += 1;
      else if (tone === "bad") cur.bad += 1;
      agg.set(st.name, cur);
    }
  }
  const rows = [...agg.entries()];

  return (
    <SectionCard title="Stage Timeline" subtitle="Workflow progress across stages" icon={GitBranch} accent="purple" className="h-full">
      {workflows.isLoading ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState icon={GitBranch} title="Workflow stage timeline unavailable from backend." description="Submitted, review, approval, assurance, and publish stages will appear here once workflows report stage data." />
      ) : (
        <ul className="space-y-3">
          {rows.map(([name, a]) => (
            <li key={name}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-cv-ink">{name}</span>
                <span className="text-[11px] font-medium text-cv-slate">{a.total}</span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                {a.good > 0 ? <div className={`h-full ${toneBar.good}`} style={{ width: `${(a.good / a.total) * 100}%` }} /> : null}
                {a.warn > 0 ? <div className={`h-full ${toneBar.warn}`} style={{ width: `${(a.warn / a.total) * 100}%` }} /> : null}
                {a.bad > 0 ? <div className={`h-full ${toneBar.bad}`} style={{ width: `${(a.bad / a.total) * 100}%` }} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
