"use client";

import { Stamp } from "lucide-react";

export function ApprovalsHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Stamp size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Human Sign-Off</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Approvals</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Review, approve, reject, and request changes on governance outputs — reports, audit packs, policies, risk
        acceptances, and AI production approvals — before they go live.
      </p>
    </div>
  );
}
