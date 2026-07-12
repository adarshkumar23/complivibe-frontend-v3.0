"use client";

import { Share2 } from "lucide-react";

export function TrustGraphHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Share2 size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Relationships</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
        Trust Graph
      </h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Explore how a risk connects to the controls, obligations, evidence, policies, and vendors that cover it, how it
        cascades into other risks, and how a vendor's own sub-processor chain is mapped.
      </p>
    </div>
  );
}
