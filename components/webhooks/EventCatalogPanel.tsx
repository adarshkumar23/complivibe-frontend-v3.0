"use client";

import { ListTree } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeEvents } from "@/lib/api/webhook-normalizers";
import type { WebhooksData } from "@/lib/hooks/useWebhooks";

export function EventCatalogPanel({ data }: { data: WebhooksData }) {
  const { events } = data;
  const list = normalizeEvents(events.data);

  return (
    <SectionCard title="Event Catalog" subtitle="Subscribable event types" icon={ListTree} accent="purple" className="h-full">
      {events.isLoading ? (
        <SkeletonRows rows={5} />
      ) : events.isError ? (
        <EmptyState icon={ListTree} title="Event catalog unavailable" description="The webhook events endpoint is not available on this backend yet." />
      ) : list.length === 0 ? (
        <EmptyState icon={ListTree} title="No events returned" description="Subscribable webhook event types will appear here once the backend provides them." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {list.slice(0, 16).map((e) => (
            <li key={e.id} className="rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] font-semibold text-cv-ink">{e.name}</p>
                  {e.description ? <p className="line-clamp-2 text-[11px] text-cv-slate">{e.description}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {e.category ? <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-cv-slate ring-1 ring-slate-200/70">{e.category}</span> : null}
                  {e.enabled != null ? <StatusBadge label={e.enabled ? "Enabled" : "Disabled"} tone={e.enabled ? "good" : "neutral"} /> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
