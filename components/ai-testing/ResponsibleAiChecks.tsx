"use client";

import { ShieldCheck, Scale } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeResponsibleAiChecks, checkTone } from "@/lib/api/ai-testing-normalizers";
import type { AiTestingData } from "@/lib/hooks/useAiTesting";

type Agg = { good: number; warn: number; bad: number; neutral: number; total: number };

export function ResponsibleAiChecks({ data }: { data: AiTestingData }) {
  const { list, testingById, testingLoading, anyTesting, systems } = data;

  // Aggregate real RAI checks across systems that returned a testing summary.
  const agg = new Map<string, Agg>();
  for (const s of list) {
    const e = s.rawId ? testingById.get(s.rawId) : undefined;
    if (!e?.isSuccess) continue;
    for (const c of normalizeResponsibleAiChecks(e.data)) {
      const cur = agg.get(c.label) ?? { good: 0, warn: 0, bad: 0, neutral: 0, total: 0 };
      const tone = checkTone(c);
      cur[tone] += 1;
      cur.total += 1;
      agg.set(c.label, cur);
    }
  }
  const rows = [...agg.entries()];

  return (
    <SectionCard title="Responsible AI Checks" subtitle="Coverage across tested systems" icon={Scale} accent="purple" className="h-full">
      {systems.isLoading || testingLoading ? (
        <SkeletonRows rows={5} />
      ) : !anyTesting || rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Responsible AI checks unavailable" description="Fairness, bias, robustness, explainability, privacy, security, oversight, and data-quality checks will appear here once the backend returns them." />
      ) : (
        <ul className="space-y-2.5">
          {rows.map(([label, a]) => (
            <li key={label} className="rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-cv-ink">{label}</span>
                <span className="text-[11px] font-medium text-cv-slate">{a.total} system{a.total === 1 ? "" : "s"}</span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                {a.good > 0 ? <div className="h-full bg-emerald-500" style={{ width: `${(a.good / a.total) * 100}%` }} /> : null}
                {a.warn > 0 ? <div className="h-full bg-amber-500" style={{ width: `${(a.warn / a.total) * 100}%` }} /> : null}
                {a.bad > 0 ? <div className="h-full bg-rose-500" style={{ width: `${(a.bad / a.total) * 100}%` }} /> : null}
                {a.neutral > 0 ? <div className="h-full bg-slate-300" style={{ width: `${(a.neutral / a.total) * 100}%` }} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
