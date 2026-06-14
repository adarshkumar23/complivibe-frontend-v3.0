"use client";

import { Boxes, FileCheck2, FileBarChart, PackageCheck, ClipboardList, TriangleAlert, Siren, Cpu, BadgeCheck, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { linkedRecords } from "@/lib/api/assurance-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { AssuranceData } from "@/lib/hooks/useAssurance";
import type { UseQueryResult } from "@tanstack/react-query";

type Row = { label: string; icon: LucideIcon; accent: Accent; count: number; loading: boolean };

export function LinkedWorkPanel({ data }: { data: AssuranceData }) {
  const { evidence, reports, auditPacks, questionnaires, risks, incidents, aiSystems, trustCenter } = data;

  const defs: { label: string; icon: LucideIcon; accent: Accent; q: UseQueryResult<unknown>; extra: string[] }[] = [
    { label: "Evidence", icon: FileCheck2, accent: "green", q: evidence, extra: ["evidence"] },
    { label: "Reports", icon: FileBarChart, accent: "blue", q: reports, extra: ["reports"] },
    { label: "Audit packs", icon: PackageCheck, accent: "purple", q: auditPacks, extra: ["audit_packs", "packs"] },
    { label: "Questionnaires", icon: ClipboardList, accent: "cyan", q: questionnaires, extra: ["questionnaires"] },
    { label: "Risks", icon: TriangleAlert, accent: "amber", q: risks, extra: ["risks"] },
    { label: "Incidents", icon: Siren, accent: "red", q: incidents, extra: ["incidents"] },
    { label: "AI systems", icon: Cpu, accent: "blue", q: aiSystems, extra: ["systems", "ai_systems"] },
    { label: "Trust assets", icon: BadgeCheck, accent: "teal", q: trustCenter, extra: ["assets", "trust_assets", "documents"] }
  ];

  const rows: Row[] = defs.map((d) => ({
    label: d.label,
    icon: d.icon,
    accent: d.accent,
    count: d.q.isSuccess ? linkedRecords(d.q.data, d.label, d.extra).length : 0,
    loading: d.q.isLoading
  }));

  const anyLoading = rows.some((r) => r.loading);
  const withRecords = rows.filter((r) => r.count > 0);

  return (
    <SectionCard title="Linked Work" subtitle="Governance records available for review" icon={Boxes} accent="cyan" className="h-full">
      {anyLoading && withRecords.length === 0 ? (
        <SkeletonRows rows={5} />
      ) : withRecords.length === 0 ? (
        <EmptyState icon={Boxes} title="Linked assurance work unavailable from backend." description="Evidence, reports, audit packs, questionnaires, risks, incidents, and AI systems available for review will appear here." />
      ) : (
        <ul className="grid grid-cols-2 gap-2.5">
          {withRecords.map((r) => (
            <li key={r.label} className="flex items-center gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <IconTile icon={r.icon} accent={r.accent} size="sm" />
              <div className="min-w-0">
                <p className="text-lg font-extrabold leading-none text-cv-ink">{r.count}</p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-cv-slate">{r.label}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
