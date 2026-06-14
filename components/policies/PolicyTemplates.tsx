"use client";

import { LayoutTemplate } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizePolicyTemplates } from "@/lib/api/policy-normalizers";
import type { PoliciesData } from "@/lib/hooks/usePolicies";

export function PolicyTemplates({ data }: { data: PoliciesData }) {
  const { templates } = data;
  const list = normalizePolicyTemplates(templates.data);

  return (
    <SectionCard title="Policy Templates" subtitle="Reusable policy blueprints" icon={LayoutTemplate} accent="cyan" className="h-full">
      {templates.isLoading ? (
        <SkeletonRows rows={4} />
      ) : templates.isError ? (
        <EmptyState icon={LayoutTemplate} title="Templates unavailable" description="The policy templates endpoint is not available on this backend yet." />
      ) : list.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="No templates returned" description="Policy templates will appear here once the backend provides them." />
      ) : (
        <ul className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 8).map((t) => (
            <li key={t.id} className="rounded-2xl bg-white/55 p-3.5 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{t.name}</p>
                {t.sectionCount != null ? <span className="shrink-0 rounded-full bg-cv-brand-soft px-2 py-0.5 text-[10px] font-semibold text-cv-blue ring-1 ring-white/60">{t.sectionCount} sections</span> : null}
              </div>
              {t.category || t.framework ? <p className="mt-0.5 text-[11px] font-medium text-cv-slate">{[t.category, t.framework].filter(Boolean).join(" · ")}</p> : null}
              {t.description ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-cv-slate">{t.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
