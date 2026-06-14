"use client";

import { Github, Slack, Ticket, Mail, AppWindow, Cloud, HardDrive, Boxes, RefreshCw, Settings2, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeIntegrations, normalizeProviderSummary, statusTone } from "@/lib/api/integration-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Accent } from "@/components/ui/accent";
import type { IntegrationsData } from "@/lib/hooks/useIntegrations";
import type { UseQueryResult } from "@tanstack/react-query";

/** No backend action endpoint exists — actions are disabled and never fake a result. */
function DisabledAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Action endpoint unavailable"
      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60"
    >
      <Icon size={12} /> {label}
    </button>
  );
}

export function ProviderStatusGrid({ data }: { data: IntegrationsData }) {
  const { integrations } = data;
  const entries = normalizeIntegrations(integrations.data);

  const named: { label: string; icon: LucideIcon; accent: Accent; q: UseQueryResult<unknown> | null; match: RegExp }[] = [
    { label: "GitHub", icon: Github, accent: "blue", q: data.github, match: /git\s*hub|github/i },
    { label: "Slack", icon: Slack, accent: "purple", q: data.slack, match: /slack/i },
    { label: "Jira", icon: Ticket, accent: "blue", q: data.jira, match: /jira|atlassian/i },
    { label: "Google Workspace", icon: Mail, accent: "amber", q: data.google, match: /google|gsuite|workspace|drive/i },
    { label: "Microsoft", icon: AppWindow, accent: "cyan", q: data.microsoft, match: /microsoft|azure|office|m365|outlook/i },
    { label: "AWS", icon: Cloud, accent: "amber", q: data.aws, match: /aws|amazon/i },
    { label: "Storage", icon: HardDrive, accent: "teal", q: data.storage, match: /storage|s3|blob|bucket/i }
  ];

  // Resolve each named provider's matching integration entry; track which entries were claimed.
  const claimed = new Set<string>();
  const resolved = named.map((p) => {
    const entry = entries.find((e) => !claimed.has(e.id) && (p.match.test(e.name) || (e.type ? p.match.test(e.type) : false)));
    if (entry) claimed.add(entry.id);
    return { ...p, entry };
  });
  // "Other" = real integration entries not matched by any named provider.
  const leftovers = entries.filter((e) => !claimed.has(e.id));

  type Tile = { label: string; icon: LucideIcon; accent: Accent; q: UseQueryResult<unknown> | null; entry: (typeof entries)[number] | undefined; otherCount: number | null };
  const tiles: Tile[] = [
    ...resolved.map((r) => ({ label: r.label, icon: r.icon, accent: r.accent, q: r.q, entry: r.entry, otherCount: null })),
    { label: "Other", icon: Boxes, accent: "blue", q: null, entry: undefined, otherCount: leftovers.length > 0 ? leftovers.length : null }
  ];

  return (
    <SectionCard title="Provider Status" subtitle="Connection status per integration" icon={Boxes} accent="blue">
      {integrations.isLoading ? (
        <SkeletonRows rows={4} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((p) => {
            const summary = p.q?.isSuccess ? normalizeProviderSummary(p.q.data) : null;
            const entry = p.entry;
            const status = summary?.status ?? entry?.status ?? null;
            const lastSync = summary?.lastSync ?? entry?.lastSync ?? null;
            const recordCount = summary?.recordCount ?? p.otherCount ?? null;
            const error = summary?.error ?? entry?.error ?? null;
            const loading = p.q?.isLoading ?? false;
            const configured = summary?.configured;
            const known = status != null || lastSync != null || recordCount != null || configured === true;

            return (
              <div key={p.label} className="flex flex-col gap-3 rounded-2xl bg-white/55 p-4 ring-1 ring-white/70">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <IconTile icon={p.icon} accent={p.accent} size="sm" />
                    <p className="truncate text-[13px] font-semibold text-cv-ink">{p.label}</p>
                  </div>
                  {loading ? (
                    <span className="text-[11px] text-cv-mist">…</span>
                  ) : error ? (
                    <StatusBadge label="Error" tone="bad" />
                  ) : status ? (
                    <StatusBadge label={status} tone={statusTone(status)} />
                  ) : (
                    <StatusBadge label="Not configured" tone="neutral" />
                  )}
                </div>

                <div className="min-h-[2.5rem] text-[11px] text-cv-slate">
                  {known ? (
                    <div className="flex flex-col gap-0.5">
                      {recordCount != null ? <span className="font-semibold text-cv-ink">{recordCount} records</span> : null}
                      <span>{lastSync ? `Synced ${formatRelativeTime(lastSync)}` : "No sync recorded"}</span>
                      {error ? <span className="truncate text-rose-600">{error}</span> : null}
                    </div>
                  ) : (
                    <span className="text-cv-mist">No connection data from backend</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-white/50 pt-2.5">
                  <DisabledAction icon={RefreshCw} label="Re-sync" />
                  <DisabledAction icon={Settings2} label="Configure" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
