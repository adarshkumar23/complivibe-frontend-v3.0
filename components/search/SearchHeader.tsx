"use client";

import { Search } from "lucide-react";

export function SearchHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Search size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Unified Discovery</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Search</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Search across AI systems, evidence, risks, incidents, reports, questionnaires, policies, approvals, assurance,
        regulatory work, and more — over real records from every connected module.
      </p>
    </div>
  );
}
