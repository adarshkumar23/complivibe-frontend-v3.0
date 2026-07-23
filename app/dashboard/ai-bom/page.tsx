"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Boxes,
  Plus,
  Loader2,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { AddComponentModal } from "@/components/aibom/AddComponentModal";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import { formatDate } from "@/lib/utils/format";
import {
  useAiSystemsList,
  useLatestAibom,
  useCreateAibomVersion
} from "@/lib/hooks/useAibom";
import {
  AIBOM_COMPONENT_TYPES,
  AIBOM_COMPONENT_TYPE_LABELS,
  type AibomComponent,
  type AibomComponentType
} from "@/lib/api/aibom";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

const inputBase =
  "w-full rounded-2xl bg-white/65 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 transition focus:outline-none focus:ring-2 focus:ring-cv-blue/45";

function AibomHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Boxes size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">AI Governance</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">AI-BOM</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        A versioned bill of materials for each AI system — the training data, base models, fine-tuning datasets,
        runtime feeds, third-party APIs, and framework libraries it is built on.
      </p>
    </div>
  );
}

function ComponentRow({ component }: { component: AibomComponent }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white/45 px-3.5 py-3 ring-1 ring-white/60">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-cv-ink">{component.name}</p>
          {component.version ? (
            <span className="rounded-md bg-slate-400/12 px-1.5 py-0.5 text-[11px] font-semibold text-cv-slate ring-1 ring-slate-400/20">
              {component.version}
            </span>
          ) : null}
          {component.is_third_party ? <StatusBadge label="Third-party" tone="warn" /> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cv-slate">
          {component.source ? <span>Source: {component.source}</span> : null}
          {component.license_type ? <span>License: {component.license_type}</span> : null}
          {component.source_integration ? <span>via {component.source_integration}</span> : null}
        </div>
        {component.risk_notes ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-cv-slate">
            <ShieldAlert size={13} className="mt-0.5 shrink-0 text-amber-500" />
            {component.risk_notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function AiBomPage() {
  const canWrite = useHasPermission("ai_bom:write");
  const systemsQuery = useAiSystemsList();

  const [systemId, setSystemId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Default the picker to the first AI system once the list loads.
  useEffect(() => {
    if (!systemId && systemsQuery.data && systemsQuery.data.length > 0) {
      setSystemId(systemsQuery.data[0].id);
    }
  }, [systemsQuery.data, systemId]);

  const bomQuery = useLatestAibom(systemId);
  const createVersion = useCreateAibomVersion(systemId);

  const grouped = useMemo(() => {
    const map = new Map<AibomComponentType, AibomComponent[]>();
    for (const c of bomQuery.data?.components ?? []) {
      const list = map.get(c.component_type) ?? [];
      list.push(c);
      map.set(c.component_type, list);
    }
    return map;
  }, [bomQuery.data]);

  const selectedSystem = systemsQuery.data?.find((s) => s.id === systemId) ?? null;

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <AibomHeader />
      </motion.div>

      {/* System picker + state ------------------------------------------------ */}
      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        {systemsQuery.isLoading ? (
          <SectionCard title="AI system" icon={Layers} accent="purple">
            <SkeletonRows rows={2} />
          </SectionCard>
        ) : systemsQuery.isError ? (
          <SectionCard title="AI system" icon={Layers} accent="purple">
            <ErrorState onRetry={() => systemsQuery.refetch()} />
          </SectionCard>
        ) : (systemsQuery.data?.length ?? 0) === 0 ? (
          <SectionCard title="AI system" icon={Layers} accent="purple">
            <EmptyState
              icon={Layers}
              title="No AI systems yet"
              description="An AI-BOM is scoped to an AI system. Register a system in AI Governance first, then come back to build its bill of materials."
            />
            <div className="mt-4 flex justify-center">
              <Link
                href="/dashboard/ai-systems"
                className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white"
              >
                Go to AI Systems <ArrowUpRight size={13} />
              </Link>
            </div>
          </SectionCard>
        ) : (
          <SectionCard
            title="AI system"
            subtitle="Pick a system to view or build its AI-BOM"
            icon={Layers}
            accent="purple"
          >
            <label htmlFor="aibom-system" className="sr-only">
              AI system
            </label>
            <select
              id="aibom-system"
              value={systemId ?? ""}
              onChange={(e) => setSystemId(e.target.value || null)}
              className={inputBase}
            >
              {systemsQuery.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </SectionCard>
        )}
      </motion.div>

      {/* Latest BOM for the selected system ---------------------------------- */}
      {systemId ? (
        <motion.div variants={fade} custom={2} initial="hidden" animate="show">
          {bomQuery.isLoading ? (
            <SectionCard title="Latest AI-BOM" icon={Boxes} accent="blue">
              <SkeletonRows rows={4} />
            </SectionCard>
          ) : bomQuery.isError ? (
            <SectionCard title="Latest AI-BOM" icon={Boxes} accent="blue">
              <ErrorState onRetry={() => bomQuery.refetch()} />
            </SectionCard>
          ) : !bomQuery.data ? (
            // 404 → no BOM generated yet for this system.
            <SectionCard title="Latest AI-BOM" icon={Boxes} accent="blue">
              <EmptyState
                icon={Boxes}
                title="No AI-BOM yet"
                description={
                  selectedSystem
                    ? `${selectedSystem.name} doesn't have a bill of materials. Generate the first version, then add its components.`
                    : "This system doesn't have a bill of materials yet."
                }
              />
              {canWrite ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => createVersion.mutate(undefined)}
                    disabled={createVersion.isPending}
                    className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {createVersion.isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Plus size={15} strokeWidth={2.6} />
                    )}
                    Generate AI-BOM
                  </button>
                </div>
              ) : null}
            </SectionCard>
          ) : (
            <SectionCard
              title="Latest AI-BOM"
              subtitle={`Version ${bomQuery.data.record.version} · generated ${
                formatDate(bomQuery.data.record.generated_at) ?? "—"
              }`}
              icon={Boxes}
              accent="blue"
              action={
                canWrite ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => createVersion.mutate(undefined)}
                      disabled={createVersion.isPending}
                      className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {createVersion.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Layers size={13} strokeWidth={2.4} />
                      )}
                      New version
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddOpen(true)}
                      className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3.5 py-2 text-xs font-bold text-white shadow-button transition hover:opacity-90"
                    >
                      <Plus size={13} strokeWidth={2.6} />
                      Add component
                    </button>
                  </div>
                ) : null
              }
            >
              {(bomQuery.data.components.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Boxes}
                  title="No components recorded"
                  description={
                    canWrite
                      ? "Add the first component — a base model, dataset, API, or library this system depends on."
                      : "This BOM version has no components yet."
                  }
                  compact
                />
              ) : (
                <div className="space-y-5">
                  {AIBOM_COMPONENT_TYPES.map((type) => {
                    const items = grouped.get(type);
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={type}>
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate">
                            {AIBOM_COMPONENT_TYPE_LABELS[type]}
                          </h3>
                          <span className="rounded-full bg-slate-400/12 px-2 py-0.5 text-[11px] font-semibold text-cv-slate">
                            {items.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {items.map((c) => (
                            <ComponentRow key={c.id} component={c} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}
        </motion.div>
      ) : null}

      <AddComponentModal open={addOpen} onClose={() => setAddOpen(false)} systemId={systemId} />
    </div>
  );
}
