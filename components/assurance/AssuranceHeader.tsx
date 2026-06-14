"use client";

import { ClipboardCheck } from "lucide-react";

export function AssuranceHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <ClipboardCheck size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Expert Review</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Assurance Review</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        The human review and sign-off layer for AI governance — validate evidence, review findings, and confirm audit
        readiness before outputs are released.
      </p>
    </div>
  );
}
