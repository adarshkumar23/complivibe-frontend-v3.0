"use client";

import { FileCheck2 } from "lucide-react";

export function EvidenceHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
            <FileCheck2 size={15} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Audit Proof Layer</span>
        </div>
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Evidence Vault</h1>
        <p className="max-w-2xl text-[15px] text-cv-slate">
          Track audit-ready evidence, freshness, ownership, linked controls, and AI system proof in one place.
        </p>
      </div>
    </div>
  );
}
