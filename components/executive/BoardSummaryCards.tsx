"use client";

import { HeartPulse, AlertCircle, Ban, History, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { IconTile } from "@/components/ui/IconTile";
import { normalizeRisks, isMitigated } from "@/lib/api/risk-normalizers";
import { normalizeIncidents, isResolved } from "@/lib/api/incident-normalizers";
import { normalizeRegulatoryDeadlines } from "@/lib/api/regulatory-normalizers";
import { normalizeApprovals, isPending } from "@/lib/api/approval-normalizers";
import { normalizeQuestionnaires, isComplete as qComplete } from "@/lib/api/questionnaire-normalizers";
import type { Accent } from "@/components/ui/accent";
import type { ExecutiveSummaryData } from "@/lib/hooks/useExecutiveSummary";

function within7d(iso: string | null): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && Date.now() - t <= 7 * 86_400_000 && t <= Date.now();
}

export function BoardSummaryCards({ data }: { data: ExecutiveSummaryData }) {
  const { risks, incidents, regulatory, approvals, questionnaires } = data;

  const riskList = risks.isSuccess ? normalizeRisks(risks.data) : null;
  const incList = incidents.isSuccess ? normalizeIncidents(incidents.data) : null;
  const regList = regulatory.isSuccess ? normalizeRegulatoryDeadlines(regulatory.data) : null;
  const apprList = approvals.isSuccess ? normalizeApprovals(approvals.data) : null;
  const qList = questionnaires.isSuccess ? normalizeQuestionnaires(questionnaires.data) : null;

  const openHigh = riskList ? riskList.filter((r) => !isMitigated(r.status) && r.hasSeverity && /(critical|high)/i.test(r.severity)).length : null;
  const openInc = incList ? incList.filter((i) => !isResolved(i.status)).length : null;
  const overdueDeadlines = regList ? regList.filter((d) => d.daysRemaining != null && d.daysRemaining < 0).length : null;
  const soonDeadlines = regList ? regList.filter((d) => d.daysRemaining != null && d.daysRemaining >= 0 && d.daysRemaining <= 30).length : null;
  const pendingApprovals = apprList ? apprList.filter(isPending).length : null;
  const incompleteQ = qList ? qList.filter((q) => !qComplete(q)).length : null;

  const healthy: string[] = [];
  if (openInc === 0) healthy.push("No unresolved incidents");
  if (overdueDeadlines === 0) healthy.push("No overdue regulatory deadlines");
  if (openHigh === 0) healthy.push("No open high/critical risks");

  const attention: string[] = [];
  if (openHigh != null && openHigh > 0) attention.push(`${openHigh} open high/critical risk${openHigh === 1 ? "" : "s"}`);
  if (soonDeadlines != null && soonDeadlines > 0) attention.push(`${soonDeadlines} deadline${soonDeadlines === 1 ? "" : "s"} within 30 days`);
  if (pendingApprovals != null && pendingApprovals > 0) attention.push(`${pendingApprovals} pending approval${pendingApprovals === 1 ? "" : "s"}`);
  if (incompleteQ != null && incompleteQ > 0) attention.push(`${incompleteQ} incomplete questionnaire${incompleteQ === 1 ? "" : "s"}`);

  const blocked: string[] = [];
  if (overdueDeadlines != null && overdueDeadlines > 0) blocked.push(`${overdueDeadlines} overdue regulatory deadline${overdueDeadlines === 1 ? "" : "s"}`);
  if (openInc != null && openInc > 0) blocked.push(`${openInc} unresolved incident${openInc === 1 ? "" : "s"}`);

  // "Changed recently" only from real timestamps within 7 days.
  const changedCount = (riskList || incList)
    ? [...(riskList ?? []).map((r) => r.updatedAt), ...(incList ?? []).map((i) => i.updatedAt)].filter(within7d).length
    : null;
  const changed: string[] = [];
  if (changedCount != null) changed.push(`${changedCount} risk/incident record${changedCount === 1 ? "" : "s"} updated in the last 7 days`);

  const cards: { title: string; icon: LucideIcon; accent: Accent; facts: string[]; loaded: boolean }[] = [
    { title: "What is healthy", icon: HeartPulse, accent: "green", facts: healthy, loaded: openInc != null || overdueDeadlines != null || openHigh != null },
    { title: "What needs attention", icon: AlertCircle, accent: "amber", facts: attention, loaded: openHigh != null || soonDeadlines != null || pendingApprovals != null || incompleteQ != null },
    { title: "What is blocked", icon: Ban, accent: "red", facts: blocked, loaded: overdueDeadlines != null || openInc != null },
    { title: "What changed recently", icon: History, accent: "blue", facts: changed, loaded: changedCount != null }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <GlassCard key={c.title} className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2.5">
            <IconTile icon={c.icon} accent={c.accent} size="sm" />
            <p className="text-[13px] font-bold text-cv-ink">{c.title}</p>
          </div>
          {!c.loaded ? (
            <p className="text-[12px] text-cv-mist">Unavailable from backend.</p>
          ) : c.facts.length === 0 ? (
            <p className="text-[12px] text-cv-mist">Nothing to report.</p>
          ) : (
            <ul className="space-y-1.5">
              {c.facts.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-cv-slate">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cv-brand" /> {f}
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
