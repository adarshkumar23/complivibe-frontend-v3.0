"use client";

import { TriangleAlert } from "lucide-react";

export function RisksHeader() {
  return (
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
  );
}
