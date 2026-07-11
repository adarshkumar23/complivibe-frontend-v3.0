"use client";

import { useState } from "react";
import { Plus, ScrollText } from "lucide-react";
import { PolicyFormModal } from "@/components/policies/PolicyFormModal";

export function PoliciesHeader() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <ScrollText size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Governance Library</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Policies</h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            Manage governance policies, map them to regulatory frameworks, track review cycles, and keep evidence aligned
            for audit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          data-testid="new-policy"
          className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90"
        >
          <Plus size={15} strokeWidth={2.6} />
          New policy
        </button>
      </div>

      <PolicyFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
