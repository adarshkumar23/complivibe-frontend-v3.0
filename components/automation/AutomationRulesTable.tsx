"use client";

import { useMemo, useState } from "react";
import { Search, Zap, Inbox, Plus, Power, Play, ScrollText, Link2, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeAutomationRules, statusTone, resultTone } from "@/lib/api/automation-normalizers";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AutomationData } from "@/lib/hooks/useAutomation";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

/** No backend action endpoint exists — actions are disabled and never fake a result. */
function DisabledAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1.5 text-[11px] font-semibold text-cv-mist ring-1 ring-white/60">
      <Icon size={12} /> {label}
    </button>
  );
}

export function AutomationRulesTable({ data }: { data: AutomationData }) {
  const { rules } = data;
  const list = useMemo(() => normalizeAutomationRules(rules.data), [rules.data]);

  const [query, setQuery] = useState("");
  const [trigger, setTrigger] = useState("all");

  const triggers = useMemo(() => distinct(list.map((r) => r.triggerType)), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((r) => {
      if (trigger !== "all" && r.triggerType !== trigger) return false;
      if (!q) return true;
      return [r.name, r.triggerType, r.actionType, r.owner].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, trigger]);

  const selectCls = "cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

  return (
    <SectionCard
      title="Automation Rules"
      subtitle="Triggers, actions & schedules"
      icon={Zap}
      accent="blue"
      action={
        <div className="flex items-center gap-2">
          {rules.isSuccess ? <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">{list.length}</span> : null}
          <DisabledAction icon={Plus} label="Create automation" />
        </div>
      }
    >
      {rules.isLoading ? (
        <SkeletonRows rows={6} />
      ) : rules.isError ? (
        <ErrorState title="Automation rules unavailable" description="The automation endpoint is not available on this backend yet." onRetry={() => rules.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Inbox} title="No automations returned" description="Automation rules, triggers, and schedules will appear here once the backend provides them." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search automations, triggers, owners..." className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none" />
            </div>
            {triggers.length > 0 ? (
              <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={selectCls}>
                <option value="all">All triggers</option>
                {triggers.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No automations match your filters" description="Try adjusting search or filters." />
          ) : (
            <ul className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
              {filtered.map((r) => (
                <li key={r.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile icon={Zap} accent="blue" size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-cv-ink">{r.name}</p>
                        <p className="truncate text-[11px] text-cv-slate">
                          {[r.triggerType ? `on ${r.triggerType}` : null, r.actionType ? `→ ${r.actionType}` : null, r.owner].filter(Boolean).join(" · ") || "No trigger / action"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {r.status ? <StatusBadge label={r.status} tone={statusTone(r.status)} /> : <StatusBadge label="Unclassified" tone="neutral" />}
                      {r.lastResult ? <StatusBadge label={r.lastResult} tone={resultTone(r.lastResult)} /> : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-[11px] text-cv-mist">
                    <span>{r.lastRun ? `Last run ${formatRelativeTime(r.lastRun)}` : "Last run —"}</span>
                    <span>{r.nextRun ? `Next ${formatRelativeTime(r.nextRun)}` : "Next run —"}</span>
                    {r.linkedResource ? <span className="inline-flex items-center gap-1 font-medium text-cv-blue"><Link2 size={11} /> {r.linkedResource}</span> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/50 pt-3 pl-12">
                    <DisabledAction icon={Power} label="Enable / Disable" />
                    <DisabledAction icon={Play} label="Run now" />
                    <DisabledAction icon={ScrollText} label="View logs" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
