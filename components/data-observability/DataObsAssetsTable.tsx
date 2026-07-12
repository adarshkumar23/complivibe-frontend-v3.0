"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Plus, Workflow } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AssetRegisterModal } from "@/components/data-observability/AssetRegisterModal";
import type { DataObservabilityData } from "@/lib/hooks/useDataObservability";

function tierTone(tier: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!tier) return "neutral";
  if (tier === "restricted" || tier === "secret") return "bad";
  if (tier === "confidential") return "warn";
  return "good";
}

export function DataObsAssetsTable({ data }: { data: DataObservabilityData }) {
  const { assets } = data;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <SectionCard
      title="Data asset inventory"
      subtitle="Every record is a live row from the data-observability registry"
      icon={Database}
      accent="cyan"
      action={
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          data-testid="register-asset"
          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-4 py-2 text-xs font-bold text-white shadow-button transition hover:-translate-y-0.5"
        >
          <Plus size={14} strokeWidth={2.6} />
          Register asset
        </button>
      }
    >
      {assets.isLoading ? (
        <SkeletonRows rows={4} />
      ) : assets.isError ? (
        <ErrorState
          title="Assets could not load"
          description={assets.error instanceof Error ? assets.error.message : undefined}
          onRetry={() => assets.refetch()}
        />
      ) : (assets.data ?? []).length === 0 ? (
        <EmptyState
          icon={Database}
          title="No data assets registered"
          description="The live registry returned zero assets for this organization. Register the first one to start tracking classification, quality and retention."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wide text-cv-mist">
                <th className="pb-2.5 pr-3">Asset</th>
                <th className="pb-2.5 pr-3">Type</th>
                <th className="pb-2.5 pr-3">Sensitivity</th>
                <th className="pb-2.5 pr-3">Classification</th>
                <th className="pb-2.5 pr-3">Status</th>
                <th className="pb-2.5">Lineage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {(assets.data ?? []).map((a) => (
                <tr key={a.id} className="align-middle">
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-cv-ink">{a.name}</p>
                    {a.source_system ? <p className="text-[11px] text-cv-slate">{a.source_system}</p> : null}
                  </td>
                  <td className="py-3 pr-3 text-xs font-medium text-cv-slate">{a.asset_type.replace(/_/g, " ")}</td>
                  <td className="py-3 pr-3">
                    {a.sensitivity_tier ? (
                      <StatusBadge label={a.sensitivity_tier} tone={tierTone(a.sensitivity_tier)} />
                    ) : (
                      <span className="text-xs text-cv-mist">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {a.classification_type ? (
                      <StatusBadge
                        label={a.classification_type.replace(/_/g, " ")}
                        tone={a.classification_confirmed ? "good" : "info"}
                      />
                    ) : (
                      <span className="text-xs text-cv-mist">unclassified</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge label={a.status} tone={a.status === "active" ? "good" : "neutral"} />
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/dashboard/data-observability/lineage?asset=${a.id}`}
                      className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-bold text-cv-blue ring-1 ring-white/70 transition hover:bg-white"
                    >
                      <Workflow size={12} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AssetRegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </SectionCard>
  );
}
