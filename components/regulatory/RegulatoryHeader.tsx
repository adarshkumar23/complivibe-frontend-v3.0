"use client";

import { Scale } from "lucide-react";

export function RegulatoryHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Scale size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Regulatory Watch</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Regulatory Intelligence</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Track real-time regulatory obligations, framework coverage, and upcoming compliance deadlines across every
        jurisdiction your AI systems operate in.
      </p>
    </div>
  );
}
