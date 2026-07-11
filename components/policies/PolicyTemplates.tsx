"use client";

import { LayoutTemplate, FileStack } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { PoliciesData } from "@/lib/hooks/usePolicies";

/** System policy templates from GET /api/v1/compliance/policy-templates. */
export function PolicyTemplates({ data }: { data: PoliciesData }) {
  const { templates } = data;
  const items = (templates.data ?? []).slice(0, 6);

  return (
    <SectionCard title="Policy Templates" subtitle="Start from a framework-tagged template" icon={LayoutTemplate} accent="purple">
      {templates.isLoading ? (
        <SkeletonRows rows={4} />
      ) : templates.isError ? (
        <ErrorState compact title="Unable to load templates" onRetry={() => templates.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={FileStack} title="No templates available" description="Policy templates will appear here." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((t) => (
            <li key={t.id} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold leading-snug text-cv-ink">{t.title}</p>
                {t.is_system ? <StatusBadge label="System" tone="info" /> : null}
              </div>
              {t.framework_tags && t.framework_tags.length > 0 ? (
                <p className="mt-1 flex flex-wrap gap-1">
                  {t.framework_tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-cv-brand-soft px-2 py-0.5 text-[10px] font-semibold text-cv-blue">
                      {tag}
                    </span>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
