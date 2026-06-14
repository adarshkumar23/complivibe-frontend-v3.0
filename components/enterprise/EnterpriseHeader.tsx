"use client";

import { Building2 } from "lucide-react";

export function EnterpriseHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Building2 size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Enterprise Administration</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Enterprise Control</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Workspace governance, access control, organization readiness, integrations, and production health — shown only
        from real backend data. Secrets, tokens, and raw credentials are never displayed.
      </p>
    </div>
  );
}
