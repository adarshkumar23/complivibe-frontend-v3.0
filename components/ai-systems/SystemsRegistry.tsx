"use client";

import { useMemo, useState } from "react";
import { Search, BrainCircuit, Bot, Plus, PencilLine } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { AiSystemFormModal } from "@/components/ai-systems/AiSystemFormModal";
import type { AiSystem } from "@/lib/api/ai-systems";
import type { AiSystemsData } from "@/lib/hooks/useAiSystems";

function lifecycleTone(status: string): "good" | "warn" | "bad" | "neutral" | "info" {
  switch (status) {
    case "production":
      return "good";
    case "testing":
      return "info";
    case "in_development":
    case "proposed":
      return "warn";
    case "retired":
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

export function SystemsRegistry({ data }: { data: AiSystemsData }) {
  const { systems } = data;
  const list = useMemo(() => systems.data ?? [], [systems.data]);

  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AiSystem | null>(null);

  const lifecycles = useMemo(() => [...new Set(list.map((s) => s.lifecycle_status))], [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((s) => {
      if (lifecycle !== "all" && s.lifecycle_status !== lifecycle) return false;
      if (!q) return true;
      return [s.name, s.model_name, s.system_type, s.intended_purpose, s.vendor_name]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [list, query, lifecycle]);

  return (
    <SectionCard
      title="AI System Registry"
      subtitle="Every model, feature, and agent under governance"
      icon={BrainCircuit}
      accent="purple"
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {systems.isSuccess ? (
            <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
              {list.length} systems
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5"
          >
            <Plus size={13} strokeWidth={2.6} />
            Register system
          </button>
        </div>
      }
    >
      {systems.isLoading ? (
        <SkeletonRows rows={5} />
      ) : systems.isError ? (
        <ErrorState title="Unable to load AI systems" onRetry={() => systems.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Bot} title="No AI systems registered" description="Register your first AI system to bring it under governance." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search systems, models, vendors…"
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <select
              value={lifecycle}
              onChange={(e) => setLifecycle(e.target.value)}
              className="cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="all">All lifecycle stages</option>
              {lifecycles.map((l) => (
                <option key={l} value={l}>
                  {l.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No systems match" description="Try adjusting search or filters." />
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((s) => (
                <li key={s.id} className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-snug text-cv-ink">{s.name}</p>
                      <p className="mt-0.5 text-[11px] text-cv-slate">
                        {[
                          s.system_type.replaceAll("_", " "),
                          s.model_name,
                          s.deployment_environment,
                          s.technical_owner_user_id ? null : "no technical owner"
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <StatusBadge label={s.lifecycle_status.replaceAll("_", " ")} tone={lifecycleTone(s.lifecycle_status)} />
                      <button
                        type="button"
                        onClick={() => setEditing(s)}
                        aria-label={`Edit ${s.name}`}
                        title={`Edit ${s.name}`}
                        className="cv-ring-focus inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink"
                      >
                        <PencilLine size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <AiSystemFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AiSystemFormModal open={editing != null} onClose={() => setEditing(null)} system={editing} />
    </SectionCard>
  );
}
