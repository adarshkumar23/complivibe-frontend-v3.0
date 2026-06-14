"use client";

import { Boxes, Stamp, ClipboardCheck, FileBarChart, PackageCheck, ClipboardList, FileCheck2, TriangleAlert, Siren, Cpu, BadgeCheck, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { recordCount } from "@/lib/api/automation-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { WorkflowsData } from "@/lib/hooks/useWorkflows";
import type { UseQueryResult } from "@tanstack/react-query";

export function LinkedGovernanceWork({ data }: { data: WorkflowsData }) {
  const { approvals, assurance, reports, auditPacks, questionnaires, evidence, risks, incidents, aiSystems, trustCenter } = data;

  const defs: { label: string; icon: LucideIcon; accent: Accent; q: UseQueryResult<unknown>; extra: string[] }[] = [
    { label: "Approvals", icon: Stamp, accent: "blue", q: approvals, extra: ["approvals", "queue"] },
    { label: "Assurance", icon: ClipboardCheck, accent: "purple", q: assurance, extra: ["cases", "reviews"] },
    { label: "Reports", icon: FileBarChart, accent: "blue", q: reports, extra: ["reports"] },
    { label: "Audit packs", icon: PackageCheck, accent: "purple", q: auditPacks, extra: ["audit_packs", "packs"] },
    { label: "Questionnaires", icon: ClipboardList, accent: "cyan", q: questionnaires, extra: ["questionnaires"] },
    { label: "Evidence", icon: FileCheck2, accent: "green", q: evidence, extra: ["evidence"] },
    { label: "Risks", icon: TriangleAlert, accent: "amber", q: risks, extra: ["risks"] },
    { label: "Incidents", icon: Siren, accent: "red", q: incidents, extra: ["incidents"] },
    { label: "AI systems", icon: Cpu, accent: "blue", q: aiSystems, extra: ["systems", "ai_systems"] },
    { label: "Trust assets", icon: BadgeCheck, accent: "teal", q: trustCenter, extra: ["assets", "trust_assets", "documents"] }
  ];

  const rows = defs.map((d) => ({ label: d.label, icon: d.icon, accent: d.accent, count: d.q.isSuccess ? recordCount(d.q.data, d.extra) : 0, loading: d.q.isLoading }));
  const anyLoading = rows.some((r) => r.loading);
  const withRecords = rows.filter((r) => r.count > 0);

  return (
    <SectionCard title="Linked Governance Work" subtitle="Records flowing through workflows" icon={Boxes} accent="cyan">
      {anyLoading && withRecords.length === 0 ? (
        <SkeletonRows rows={4} />
      ) : withRecords.length === 0 ? (
        <EmptyState icon={Boxes} title="Linked governance work unavailable from backend." description="Approvals, assurance, reports, audit packs, questionnaires, evidence, risks, incidents, and AI systems will appear here." />
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
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
