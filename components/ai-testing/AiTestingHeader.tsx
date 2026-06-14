"use client";

import { FlaskConical } from "lucide-react";

export function AiTestingHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <FlaskConical size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Model Assurance</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">AI Testing</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Validate AI systems with safety checks, responsible-AI evaluations, and governance testing to confirm evaluation
        readiness before deployment.
      </p>
    </div>
  );
}
