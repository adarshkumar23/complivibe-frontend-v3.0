"use client";

import { Webhook, WifiOff, Plus, Pencil, Power, KeyRound, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeWebhooks, webhookStatusTone } from "@/lib/api/webhook-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { WebhooksData } from "@/lib/hooks/useWebhooks";

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

export function WebhookEndpointsTable({ data }: { data: WebhooksData }) {
  const { webhooks } = data;
  const list = normalizeWebhooks(webhooks.data);

  return (
    <SectionCard
      title="Webhook Endpoints"
      subtitle="Configured delivery endpoints"
      icon={Webhook}
      accent="blue"
      action={
        <div className="flex items-center gap-2">
          {webhooks.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length}</span> : null}
          <DisabledAction icon={Plus} label="Create webhook" />
        </div>
      }
    >
      {webhooks.isLoading ? (
        <SkeletonRows rows={5} />
      ) : webhooks.isError ? (
        <ErrorState title="Webhooks unavailable" description="The webhooks endpoint is not available on this backend yet." onRetry={() => webhooks.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={WifiOff} title="No webhooks returned" description="Configured webhook endpoints will appear here once the backend provides them." />
      ) : (
        <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
          {list.map((w) => (
            <li key={w.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <IconTile icon={Webhook} accent="blue" size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-cv-ink">{w.name}</p>
                    {w.url ? <p className="truncate font-mono text-[11px] text-cv-slate">{w.url}</p> : <p className="text-[11px] text-cv-mist">No endpoint URL</p>}
                  </div>
                </div>
                {w.status ? <StatusBadge label={w.status} tone={webhookStatusTone(w.status)} /> : <StatusBadge label="Unknown" tone="neutral" />}
              </div>

              {w.eventTypes.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-12">
                  {w.eventTypes.slice(0, 6).map((e) => (
                    <span key={e} className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-cv-slate ring-1 ring-slate-200/70">{e}</span>
                  ))}
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-[11px] text-cv-mist">
                <span>{w.lastDelivery ? `Last delivery ${formatRelativeTime(w.lastDelivery)}` : "No deliveries"}</span>
                {w.failureRate != null ? <span>{Math.round(w.failureRate)}% failures</span> : null}
                {w.owner ? <span>by {w.owner}</span> : null}
                {w.signingStatus ? <span className="inline-flex items-center gap-1 font-medium text-cv-slate"><KeyRound size={11} /> signing: {w.signingStatus}</span> : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-white/50 pt-3 pl-12">
                <DisabledAction icon={Pencil} label="Edit" />
                <DisabledAction icon={Power} label="Disable" />
                <DisabledAction icon={KeyRound} label="Rotate secret" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
