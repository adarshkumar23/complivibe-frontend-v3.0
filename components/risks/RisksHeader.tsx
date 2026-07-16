"use client";

import { useState } from "react";
import { Plus, TriangleAlert } from "lucide-react";
import { RiskFormModal } from "@/components/risks/RiskFormModal";
import { useHasPermission } from "@/lib/hooks/usePermissions";

export function RisksHeader() {
  const [createOpen, setCreateOpen] = useState(false);
  const canCreateRisk = useHasPermission("risks:write");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
            <TriangleAlert size={15} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Risk Intelligence</span>
        </div>
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
          Risk Command Center
        </h1>
        <p className="max-w-2xl text-[15px] text-cv-slate">
          Track AI, compliance, data, vendor, and operational risks with owners, severity, evidence, and mitigation status.
        </p>
      </div>

      {canCreateRisk ? (
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="cv-ring-focus inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-cv-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.6} />
          New Risk
        </button>
      ) : null}

      <RiskFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
