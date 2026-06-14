"use client";

import { Bell } from "lucide-react";

export function NotificationsHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Bell size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Signal Center</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Notifications</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Stay on top of governance signals — alerts, incidents, deadlines, reviews, approvals, and operational attention
        items — aggregated from every connected module.
      </p>
    </div>
  );
}
