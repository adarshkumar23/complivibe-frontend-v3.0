"use client";

import { Flame, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeRisks } from "@/lib/api/risk-normalizers";
import { normalizePriorityActions } from "@/lib/api/compliance-normalizers";
import { normalizeAlerts } from "@/lib/api/normalizers";
import type { Severity } from "@/lib/api/types";
import type { RisksData } from "@/lib/hooks/useRisks";

const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

type Item = { id: string; title: string; severity: Severity; description: string | null };

export function PriorityRisks({ data }: { data: RisksData }) {
  const { risks, gaps, predictive } = data;
  const list = normalizeRisks(risks.data);

  let items: Item[] = [];
  let source = "risk register";

  const sorted = [...list].sort((a, b) => order[a.severity] - order[b.severity]);
  if (sorted.length > 0) {
    items = sorted.slice(0, 5).map((r) => ({ id: r.id, title: r.title, severity: r.severity, description: r.mitigation || r.category }));
  } else {
    const fromGaps = normalizePriorityActions(gaps.data, undefined);
    if (fromGaps.length > 0) {
      items = fromGaps.slice(0, 5).map((g) => ({ id: g.id, title: g.title, severity: g.severity, description: g.description }));
      source = "compliance gaps";
    } else {
      const alerts = normalizeAlerts(undefined, predictive.data);
      items = alerts.slice(0, 5).map((a) => ({ id: a.id, title: a.title, severity: a.severity, description: a.description }));
      source = "predictive alerts";
    }
  }

  const loading = risks.isLoading;
  const errored = risks.isError && gaps.isError && predictive.isError;

  return (
    <SectionCard
      title="Priority Risks"
      subtitle={items.length > 0 ? `Top items from ${source}` : "Highest-severity items"}
      icon={Flame}
      accent="red"
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : errored ? (
        <ErrorState compact title="Unable to load priority risks" onRetry={() => risks.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={ShieldCheck} title="No priority risks" description="High and critical risks will surface here from the register, gaps, or predictive alerts." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{item.title}</p>
                <SeverityBadge severity={item.severity} />
              </div>
              {item.description ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{item.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
