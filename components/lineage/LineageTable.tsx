"use client";

import { useState } from "react";
import { TableProperties, ArrowRight } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LineageTableRow } from "@/lib/api/lineage-normalizers";

const PAGE = 12;

export function LineageTable({ rows }: { rows: LineageTableRow[] }) {
  const [limit, setLimit] = useState(PAGE);

  return (
    <SectionCard
      title="Relationships"
      subtitle="Real lineage edges derived from backend reference fields"
      icon={TableProperties}
      accent="blue"
      action={
        rows.length > 0 ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {rows.length} edges
          </span>
        ) : null
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={TableProperties}
          title="No relationships found"
          description="No real reference fields link the available records yet, so no lineage edges can be shown."
          compact
        />
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wide text-cv-mist">
                  <th className="pb-2 pr-3 font-bold">Source</th>
                  <th className="pb-2 pr-3 font-bold">Relationship</th>
                  <th className="pb-2 pr-3 font-bold">Target</th>
                  <th className="pb-2 pr-3 font-bold">Module</th>
                  <th className="pb-2 font-bold">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map((r) => (
                  <tr key={r.id} className="border-t border-white/60">
                    <td className="max-w-[180px] truncate py-2 pr-3 font-semibold text-cv-ink">{r.source}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-cv-slate ring-1 ring-white/70">
                        <ArrowRight size={10} />
                        {r.relationship}
                      </span>
                    </td>
                    <td className="max-w-[180px] truncate py-2 pr-3 font-semibold text-cv-ink">{r.target}</td>
                    <td className="py-2 pr-3 text-cv-slate">{r.sourceModule}</td>
                    <td className="py-2 text-cv-slate">{r.confidence != null ? `${Math.round(r.confidence)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > limit ? (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-[12px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
            >
              Show more ({rows.length - limit} remaining)
            </button>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
