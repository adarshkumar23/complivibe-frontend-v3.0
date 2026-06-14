"use client";

import { Plug, PlugZap } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeIntegrations } from "@/lib/api/settings-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { SettingsData } from "@/lib/hooks/useSettings";

function tone(status: string | null, hasError: boolean): "good" | "warn" | "bad" | "neutral" {
  if (hasError) return "bad";
  const s = (status || "").toLowerCase();
  if (/connect|active|enabled|ok|live|synced/.test(s)) return "good";
  if (/pending|configuring/.test(s)) return "warn";
  if (/error|failed|disconnect/.test(s)) return "bad";
  return "neutral";
}

export function IntegrationsPanel({ data }: { data: SettingsData }) {
  const { integrations } = data;
  const list = normalizeIntegrations(integrations.data);

  return (
    <SectionCard title="Integrations" subtitle="Connected services" icon={Plug} accent="purple" className="h-full">
      {integrations.isLoading ? (
        <SkeletonRows rows={4} />
      ) : integrations.isError ? (
        <ErrorState title="Unable to load integrations" onRetry={() => integrations.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={PlugZap} title="No integrations connected" description="Connected services and their sync status will appear here." />
      ) : (
        <ul className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 8).map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-3 py-2.5 ring-1 ring-white/70">
              <div className="flex min-w-0 items-center gap-3">
                <IconTile icon={Plug} accent="blue" size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-cv-ink">{i.name}</p>
                  <p className="truncate text-[11px] text-cv-slate">
                    {[i.type, i.lastSync ? `Synced ${formatRelativeTime(i.lastSync)}` : null].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              </div>
              <StatusBadge label={i.error ? "Error" : i.status || "Not configured"} tone={tone(i.status, Boolean(i.error))} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
