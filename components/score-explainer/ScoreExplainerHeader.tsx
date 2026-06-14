"use client";

import { Calculator } from "lucide-react";

export function ScoreExplainerHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Calculator size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Score Intelligence</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Score Explainer</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Understand why governance, compliance, and trust scores are what they are — backed by real score components,
        evidence coverage, risk impact, and readiness drivers from your backend.
      </p>
    </div>
  );
}
