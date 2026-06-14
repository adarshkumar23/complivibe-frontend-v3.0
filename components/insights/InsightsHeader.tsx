"use client";

import { Lightbulb } from "lucide-react";

export function InsightsHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Lightbulb size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Proactive Guidance</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Proactive Insights</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Surface governance gaps, upcoming risks, missing evidence, overdue actions, and regulatory attention areas —
        from real backend signals, with simple factual next steps.
      </p>
    </div>
  );
}
