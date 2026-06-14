"use client";

import { Share2 } from "lucide-react";

export function LineageHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Share2 size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Data Observability</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
        Data Lineage Explorer
      </h1>
      <p className="max-w-3xl text-[15px] text-cv-slate">
        Trace how data sources, pipelines, schemas, AI systems, evidence, risks, incidents, sensitive data, and
        integrations connect — and the downstream governance impact of every dataset.
      </p>
    </div>
  );
}
