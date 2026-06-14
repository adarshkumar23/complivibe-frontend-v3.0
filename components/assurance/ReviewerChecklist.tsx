"use client";

import { ListChecks, CheckCircle2, Circle, MinusCircle } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeReviewerChecklist } from "@/lib/api/assurance-normalizers";
import type { AssuranceData } from "@/lib/hooks/useAssurance";

type Agg = { done: number; total: number; status: string | null };

/** Pull raw case records (pre-normalization) so checklist fields on each case can be read. */
function rawList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    for (const key of ["items", "data", "results", "cases", "reviews"]) {
      const v = (value as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

export function ReviewerChecklist({ data }: { data: AssuranceData }) {
  const { cases, summary } = data;

  // Checklist fields live on raw case/summary payloads — read those directly.
  const allSources = [summary.data, ...rawList(cases.data)];

  const agg = new Map<string, Agg>();
  for (const src of allSources) {
    for (const item of normalizeReviewerChecklist(src)) {
      const cur = agg.get(item.label) ?? { done: 0, total: 0, status: null };
      cur.total += 1;
      if (item.done === true) cur.done += 1;
      if (item.status && !cur.status) cur.status = item.status;
      agg.set(item.label, cur);
    }
  }
  const rows = [...agg.entries()];

  return (
    <SectionCard title="Reviewer Checklist" subtitle="Sign-off checks reported by backend" icon={ListChecks} accent="purple" className="h-full">
      {cases.isLoading || summary.isLoading ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState icon={ListChecks} title="Reviewer checklist unavailable" description="Evidence, risk, policy, report, questionnaire, and sign-off checks will appear here once the backend reports them." />
      ) : (
        <ul className="space-y-2">
          {rows.map(([label, a]) => {
            const complete = a.total > 0 && a.done === a.total;
            const Icon = complete ? CheckCircle2 : a.done > 0 ? Circle : MinusCircle;
            const color = complete ? "text-emerald-500" : a.done > 0 ? "text-amber-500" : "text-cv-mist";
            return (
              <li key={label} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-cv-ink">
                  <Icon size={16} className={color} /> {label}
                </span>
                <span className="text-[11px] font-semibold text-cv-slate">{a.status ?? `${a.done}/${a.total}`}</span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
