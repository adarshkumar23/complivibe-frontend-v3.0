"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Inbox } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { formatRelativeTime } from "@/lib/utils/format";
import { resolveInboxNavigatePath } from "@/lib/utils/navigate";
import { humanizeLabel, inboxItemTone } from "@/components/insights/reasoning";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ComplianceInboxResponse } from "@/lib/api/insights";

export function InboxPanel({ inbox }: { inbox: UseQueryResult<ComplianceInboxResponse, unknown> }) {
  const items = inbox.data?.items ?? [];

  return (
    <SectionCard
      title="Compliance Inbox"
      subtitle="GET /api/v1/inbox — overdue tasks, evidence requests, attestations and approvals assigned to you, ranked by backend priority_score"
      icon={Inbox}
      accent="blue"
      className="h-full"
      action={
        inbox.data ? (
          <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
            {inbox.data.total_items} item{inbox.data.total_items === 1 ? "" : "s"}
          </span>
        ) : null
      }
    >
      {inbox.isLoading ? (
        <SkeletonRows rows={5} />
      ) : inbox.isError ? (
        <ErrorState title="Inbox unavailable" description="GET /api/v1/inbox failed." onRetry={() => inbox.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Inbox zero"
          description="Nothing is currently overdue or assigned to you — overdue tasks, evidence requests, pending attestations and approvals will surface here as soon as the backend has any."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const path = resolveInboxNavigatePath(item.navigate_path);
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold leading-snug text-cv-ink">{item.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge label={humanizeLabel(item.item_type)} tone={inboxItemTone(item.priority_score)} />
                    {path ? <ArrowUpRight size={13} className="text-cv-mist" /> : null}
                  </div>
                </div>
                {item.reason ? <p className="mt-1 text-xs leading-relaxed text-cv-slate">{item.reason}</p> : null}
                <div className="mt-1.5 flex items-center gap-3 text-[11px] font-medium text-cv-mist">
                  <span>priority score {item.priority_score}</span>
                  {item.due_at ? <span>due {formatRelativeTime(item.due_at)}</span> : null}
                </div>
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
