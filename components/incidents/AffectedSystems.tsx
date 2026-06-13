"use client";

import { Cpu } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeIncidents, categoryCounts } from "@/lib/api/incident-normalizers";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import type { IncidentsData } from "@/lib/hooks/useIncidents";

const palette = ["#EF4444", "#F59E0B", "#8B5CF6", "#3B82F6", "#06B6D4", "#14B8A6"];

export function AffectedSystems({ data }: { data: IncidentsData }) {
  const { incidents, aiSystems } = data;
  const list = normalizeIncidents(incidents.data);
  const counts = categoryCounts(list, "aiSystem");

  const nameMap = new Map<string, string>();
  normalizeAiSystems(aiSystems.data).forEach((s) => s.rawId && nameMap.set(s.rawId, s.name));
  const resolved = counts.map((c) => ({ label: nameMap.get(c.label) || c.label, value: c.value }));
  const max = resolved.reduce((m, c) => Math.max(m, c.value), 0) || 1;

  return (
    <SectionCard title="Affected Systems" subtitle="Incidents per AI system" icon={Cpu} accent="purple">
      {incidents.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : incidents.isError ? (
        <ErrorState compact title="Unable to load incidents" onRetry={() => incidents.refetch()} />
      ) : resolved.length === 0 ? (
        <EmptyState compact icon={Cpu} title="No affected systems" description="Incidents linked to AI systems will appear here once a system reference is present." />
      ) : (
        <ul className="space-y-4">
          {resolved.slice(0, 6).map((c, i) => (
            <li key={c.label}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="truncate font-semibold text-cv-ink">{c.label}</span>
                <span className="font-bold text-cv-ink">{c.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-400/12">
                <div className="h-full rounded-full" style={{ width: `${Math.max(6, (c.value / max) * 100)}%`, background: palette[i % palette.length] }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
