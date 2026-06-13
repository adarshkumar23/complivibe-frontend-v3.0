"use client";

import { ShieldCheck } from "lucide-react";
import { PublishTrustButton } from "@/components/trust-center/PublishTrustButton";

export function TrustCenterHeader({ onPublished }: { onPublished?: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
            <ShieldCheck size={15} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Customer Trust Portal</span>
        </div>
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Trust Center</h1>
        <p className="max-w-2xl text-[15px] text-cv-slate">
          Publish governance posture, audit evidence, certifications, AI system readiness, reports, and security signals
          for customers and partners.
        </p>
      </div>
      <PublishTrustButton onPublished={onPublished} />
    </div>
  );
}
