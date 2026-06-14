"use client";

import { Lock } from "lucide-react";

export function PrivacyHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Lock size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Data Governance</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Privacy</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        DPDP readiness, data handling, privacy evidence, sensitive-data signals, and retention governance — shown only
        from real backend data. Raw personal data is never displayed.
      </p>
    </div>
  );
}
