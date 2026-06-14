"use client";

import { useRouter } from "next/navigation";
import { UserCheck, Inbox, ArrowUpRight } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeApprovals, isPending, normalizeAssuranceCases, assuranceComplete } from "@/lib/api/agent-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { AgentsData } from "@/lib/hooks/useAgents";

type ReviewItem = { id: string; title: string; type: string; status: string | null; dueDate: string | null; resource: string | null };

export function HumanReviewPanel({ data }: { data: AgentsData }) {
  const { approvals, assurance } = data;
  const router = useRouter();

  const approvalItems: ReviewItem[] = approvals.isSuccess
    ? normalizeApprovals(approvals.data).filter(isPending).map((a) => ({ id: `apr-${a.id}`, title: a.title, type: "Approval", status: a.status, dueDate: a.dueDate, resource: a.linkedResource }))
    : [];
  const assuranceItems: ReviewItem[] = assurance.isSuccess
    ? normalizeAssuranceCases(assurance.data).filter((c) => !assuranceComplete(c)).map((c) => ({ id: `asr-${c.id}`, title: c.title, type: "Assurance", status: c.status, dueDate: c.dueDate, resource: c.linkedResource }))
    : [];
  const items = [...approvalItems, ...assuranceItems];

  const anySource = approvals.isSuccess || assurance.isSuccess;
  const loading = approvals.isLoading && assurance.isLoading;

  return (
    <SectionCard
      title="Human Review Queue"
      subtitle={anySource ? `${items.length} awaiting review` : "Approvals & assurance handoff"}
      icon={UserCheck}
      accent="red"
      className="h-full"
      action={<button type="button" onClick={() => router.push("/dashboard/approvals")} className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">Approvals <ArrowUpRight size={12} /></button>}
    >
      {loading ? (
        <SkeletonRows rows={4} />
      ) : !anySource ? (
        <EmptyState icon={Inbox} title="Human review queue unavailable from backend." description="Pending approvals and assurance cases will appear here once those endpoints are available." />
      ) : items.length === 0 ? (
        <EmptyState icon={Inbox} title="No items awaiting review" description="No pending approvals or open assurance cases were returned by the backend." />
      ) : (
        <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {items.slice(0, 16).map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{it.title}</p>
                <p className="truncate text-[11px] text-cv-slate">{[it.type, it.resource, it.dueDate ? `Due ${formatDate(it.dueDate)}` : null].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              {it.status ? <StatusBadge label={it.status} tone="warn" /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
