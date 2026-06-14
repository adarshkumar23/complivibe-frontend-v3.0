"use client";

import { Layers, LayoutGrid } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeFrameworks } from "@/lib/api/compliance-normalizers";
import { scoreTone } from "@/lib/utils/format";
import type { RegulatoryData } from "@/lib/hooks/useRegulatory";

export function FrameworkCoverage({ data }: { data: RegulatoryData }) {
  const { frameworks } = data;
  const list = normalizeFrameworks(frameworks.data);

  return (
    <SectionCard title="Framework Coverage" subtitle="Regulatory frameworks in scope" icon={LayoutGrid} accent="purple" className="h-full">
      {frameworks.isLoading ? (
        <SkeletonRows rows={5} />
      ) : frameworks.isError ? (
        <ErrorState title="Unable to load frameworks" onRetry={() => frameworks.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Layers} title="No frameworks returned" description="Regulatory frameworks and their coverage will appear here once the backend provides them." />
      ) : (
        <ul className="max-h-[440px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 12).map((f) => {
            const tone = scoreTone(f.coverage);
            return (
              <li key={f.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile icon={Layers} accent="purple" size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-cv-ink">{f.name}</p>
                      {f.controlsTotal != null ? (
                        <p className="truncate text-[11px] text-cv-slate">
                          {f.controlsMet != null ? `${f.controlsMet}/${f.controlsTotal} controls` : `${f.controlsTotal} controls`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {f.status ? <StatusBadge label={f.status} tone="info" /> : null}
                    {f.coverage != null ? (
                      <span className={`text-[13px] font-bold ${tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-rose-600"}`}>{Math.round(f.coverage)}%</span>
                    ) : null}
                  </div>
                </div>
                {f.coverage != null ? (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-400/12">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, Math.min(100, f.coverage))}%`,
                        background: tone === "good" ? "#10B981" : tone === "warn" ? "#F59E0B" : "#EF4444"
                      }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
