"use client";

import { FileText, FileBarChart, Image, ScrollText, KeyRound, Building2, BrainCircuit, Layers, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { normalizeEvidenceItems, categoryBoard } from "@/lib/api/evidence-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { EvidenceData } from "@/lib/hooks/useEvidence";

const META: Record<string, { icon: LucideIcon; accent: Accent }> = {
  Policies: { icon: FileText, accent: "blue" },
  Reports: { icon: FileBarChart, accent: "purple" },
  Screenshots: { icon: Image, accent: "cyan" },
  Logs: { icon: ScrollText, accent: "teal" },
  "Access Reviews": { icon: KeyRound, accent: "amber" },
  "Vendor Documents": { icon: Building2, accent: "green" },
  "AI Documentation": { icon: BrainCircuit, accent: "red" }
};

export function EvidenceHealthBoard({ data }: { data: EvidenceData }) {
  const { evidence } = data;
  const items = normalizeEvidenceItems(evidence.data);
  const { buckets, other, hasCategories } = categoryBoard(items);

  return (
    <SectionCard title="Evidence Health Board" subtitle="Coverage by evidence category" icon={Layers} accent="blue">
      {evidence.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : evidence.isError ? (
        <ErrorState title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : !hasCategories ? (
        <EmptyState
          icon={Layers}
          title="Evidence categories unavailable"
          description="Category counts will appear here once evidence records include a type or category field."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {buckets.map((b) => {
            const meta = META[b.label];
            return (
              <div key={b.label} className="flex flex-col gap-2 rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
                <IconTile icon={meta.icon} accent={meta.accent} size="sm" />
                <p className="text-2xl font-extrabold leading-none text-cv-ink">{b.value}</p>
                <p className="text-[11px] font-medium leading-tight text-cv-slate">{b.label}</p>
              </div>
            );
          })}
          {other > 0 ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <IconTile icon={Layers} accent="purple" size="sm" />
              <p className="text-2xl font-extrabold leading-none text-cv-ink">{other}</p>
              <p className="text-[11px] font-medium leading-tight text-cv-slate">Other</p>
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}
