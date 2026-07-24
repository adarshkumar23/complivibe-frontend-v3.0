"use client";

import { useState } from "react";
import { Plug, Loader2, Power } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { ApiError } from "@/lib/api/client";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import { type IntegrationsData, useDisableConnector } from "@/lib/hooks/useIntegrations";
import { type ConnectorCatalogEntry } from "@/lib/api/integrations";
import { ConnectorConfigModal } from "@/components/integrations/ConnectorConfigModal";

function ConnectorAction({ connector, isEnabled, onConnect }: { connector: ConnectorCatalogEntry; isEnabled: boolean; onConnect: (c: ConnectorCatalogEntry) => void }) {
  const disable = useDisableConnector();
  const [error, setError] = useState<string | null>(null);
  async function onDisable() {
    setError(null);
    try { await disable.mutateAsync(connector.id); } catch (e) { setError(e instanceof ApiError ? e.message : "Action failed."); }
  }
  return (
    <div className="mt-2 flex flex-col gap-1">
      {isEnabled ? (
        <button
          type="button"
          data-testid={`connector-disable-${connector.id}`}
          disabled={disable.isPending}
          onClick={onDisable}
          className="cv-ring-focus inline-flex w-fit items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold text-cv-slate ring-1 ring-white/70 shadow-button transition hover:-translate-y-0.5 hover:text-rose-600 disabled:opacity-60"
        >
          {disable.isPending ? <Loader2 size={11} className="animate-spin" /> : <Power size={11} strokeWidth={2.6} />} Disable
        </button>
      ) : (
        <button
          type="button"
          data-testid={`connector-enable-${connector.id}`}
          onClick={() => onConnect(connector)}
          className="cv-ring-focus inline-flex w-fit items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
        >
          <Power size={11} strokeWidth={2.6} /> Connect
        </button>
      )}
      {error ? <span className="text-[10px] font-semibold text-rose-600">{error}</span> : null}
    </div>
  );
}

/** Connector catalog from GET /api/v1/connectors/catalog, with enabled state + connect action. */
export function ProviderStatusGrid({ data }: { data: IntegrationsData }) {
  const { catalog, enabled } = data;
  const list = catalog.data ?? [];
  const canWrite = useHasPermission("connectors:write");
  const enabledIds = new Set((enabled.data ?? []).map((e) => (e.connector_id as string) ?? e.id));
  const [connectTarget, setConnectTarget] = useState<ConnectorCatalogEntry | null>(null);

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
              {canWrite ? <ConnectorAction connector={c} isEnabled={enabledIds.has(c.id)} onConnect={setConnectTarget} /> : null}
            </div>
          ))}
        </div>
      )}
      <ConnectorConfigModal connector={connectTarget} onClose={() => setConnectTarget(null)} />
    </SectionCard>
  );
}
