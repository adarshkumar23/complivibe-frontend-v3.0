"use client";

import { Database } from "lucide-react";

export function DataObsHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Database size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Data Trust Monitoring</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
        Data Observability Command Center
      </h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Monitor data health, freshness, lineage, pipelines, and AI dataset reliability in real time.
      </p>
    </div>
  );
}
