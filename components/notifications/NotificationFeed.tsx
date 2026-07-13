"use client";

import Link from "next/link";
import { Inbox, CheckCircle2, ArrowUpRight } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { resolveInboxNavigatePath } from "@/lib/utils/navigate";
import type { NotificationsData } from "@/lib/hooks/useNotifications";

/** Prioritized work inbox from GET /api/v1/inbox — backend supplies the "why". */
export function NotificationFeed({ data }: { data: NotificationsData }) {
  const { inbox } = data;
  const items = inbox.data?.items ?? [];

  return (
    <SectionCard
      title="Prioritized Inbox"
      subtitle="What needs your attention, ranked by the backend"
      icon={Inbox}
      accent="blue"
      className="h-full"
      action={
        inbox.data ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {inbox.data.total_items} items
          </span>
        ) : null
      }
    >
      {inbox.isLoading ? (
        <SkeletonRows rows={5} />
      ) : inbox.isError ? (
        <ErrorState title="Unable to load inbox" onRetry={() => inbox.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Inbox zero" description="Overdue tasks, reviews, and approvals will surface here." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const path = resolveInboxNavigatePath(item.navigate_path);
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">{item.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge
                      label={item.item_type.replaceAll("_", " ")}
                      tone={item.priority_score >= 100 ? "bad" : "warn"}
                    />
                    {path ? <ArrowUpRight size={13} className="text-cv-mist" /> : null}
                  </div>
                </div>
                {item.reason ? <p className="mt-1 text-xs leading-relaxed text-cv-slate">{item.reason}</p> : null}
              </>
            );
            return (
              <li key={item.item_key} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                {path ? <Link href={path}>{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
