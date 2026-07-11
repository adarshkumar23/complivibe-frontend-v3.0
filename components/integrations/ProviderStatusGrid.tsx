"use client";

import { Plug } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import type { IntegrationsData } from "@/lib/hooks/useIntegrations";

/** Connector catalog from GET /api/v1/connectors/catalog, with enabled state. */
export function ProviderStatusGrid({ data }: { data: IntegrationsData }) {
  const { catalog, enabled } = data;
  const list = catalog.data ?? [];
  const enabledIds = new Set((enabled.data ?? []).map((e) => (e.connector_id as string) ?? e.id));

  return (
    <SectionCard
      title="Connector Catalog"
      subtitle="Available integrations and their status"
      icon={Plug}
      accent="blue"
      className="h-full"
      action={
        catalog.isSuccess ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {list.length} connectors
          </span>
        ) : null
      }
    >
      {catalog.isLoading ? (
        <SkeletonRows rows={6} />
      ) : catalog.isError ? (
        <ErrorState title="Unable to load catalog" onRetry={() => catalog.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Plug} title="No connectors in catalog" description="Connector catalog entries will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {list.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-cv-ink">{c.name}</p>
                <StatusBadge
                  label={enabledIds.has(c.id) ? "Enabled" : "Available"}
                  tone={enabledIds.has(c.id) ? "good" : "neutral"}
                />
              </div>
              <p className="mt-0.5 text-[11px] text-cv-slate">{c.category?.replaceAll("_", " ")}</p>
              {c.description ? (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-cv-slate">{c.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
