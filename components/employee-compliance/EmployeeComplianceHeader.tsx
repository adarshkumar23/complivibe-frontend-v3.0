"use client";

import { UserCheck } from "lucide-react";

export function EmployeeComplianceHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <UserCheck size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">People Compliance</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Employee Compliance</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Policy acknowledgement, training, employee attestations, and team compliance readiness — shown only from real
        backend records. No completions, attestations, or statuses are fabricated.
      </p>
    </div>
  );
}
