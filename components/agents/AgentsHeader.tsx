"use client";

import { Bot } from "lucide-react";

export function AgentsHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Bot size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">AI Governance Agents</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Agents</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Governance agents monitoring evidence, risks, deadlines, questionnaires, audit packs, trust center, and compliance
        readiness. Agents, runs, and findings are shown only from real backend records.
      </p>
    </div>
  );
}
