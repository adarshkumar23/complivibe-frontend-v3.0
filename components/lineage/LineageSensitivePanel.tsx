"use client";

import { ShieldAlert, Gauge } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import type { DataLineage } from "@/lib/hooks/useDataLineage";

export function LineageSensitivePanel({ data }: { data: DataLineage }) {
  const { sensitiveFindings, qualityIssues, sensitiveUnavailable, qualityUnavailable } = data;

  return (
    <SectionCard
      title="Sensitive data & quality"
      subtitle="Metadata only — no raw values are shown"
      icon={ShieldAlert}
      accent="red"
      className="h-full"
    >
      <div className="space-y-5">
        {/* Sensitive data */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">Sensitive data signals</p>
          {sensitiveUnavailable ? (
            <p className="rounded-xl bg-slate-400/10 px-3 py-2 text-[12px] font-medium text-cv-slate ring-1 ring-slate-400/15">
              Sensitive-data endpoint unavailable.
            </p>
          ) : sensitiveFindings.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No sensitive-data signals" compact />
          ) : (
            <ul className="space-y-2">
              {sensitiveFindings.slice(0, 6).map((f) => (
                <li key={f.id} className="rounded-xl bg-white/55 p-2.5 ring-1 ring-white/70">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] font-semibold text-cv-ink">{f.category}</span>
                    {f.severity ? <SeverityBadge severity={f.severity} /> : null}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-cv-slate">
                    {f.system ? <span className="truncate">{f.system}</span> : null}
                    {f.count != null ? <span className="text-cv-mist">· {f.count.toLocaleString()} matches</span> : null}
                    {f.status ? <span className="text-cv-mist">· {f.status}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quality issues */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-cv-mist">
            <Gauge size={12} /> Quality issues
          </p>
          {qualityUnavailable ? (
            <p className="rounded-xl bg-slate-400/10 px-3 py-2 text-[12px] font-medium text-cv-slate ring-1 ring-slate-400/15">
              Quality-issues endpoint unavailable.
            </p>
          ) : qualityIssues.length === 0 ? (
            <EmptyState icon={Gauge} title="No quality issues reported" compact />
          ) : (
            <ul className="space-y-2">
              {qualityIssues.slice(0, 6).map((q) => (
                <li key={q.id} className="rounded-xl bg-white/55 p-2.5 ring-1 ring-white/70">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] font-semibold text-cv-ink">{q.title}</span>
                    {q.severity ? <SeverityBadge severity={q.severity} /> : null}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-cv-slate">
                    {q.system ? <span className="truncate">{q.system}</span> : null}
                    {q.status ? <span className="text-cv-mist">· {q.status}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
