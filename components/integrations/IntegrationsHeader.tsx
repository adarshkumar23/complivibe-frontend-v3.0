"use client";

import { Plug } from "lucide-react";

export function IntegrationsHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
          <Plug size={15} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Connected Infrastructure</span>
      </div>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Integrations</h1>
      <p className="max-w-2xl text-[15px] text-cv-slate">
        Connect governance evidence to engineering systems, communication tools, cloud, and storage — GitHub, Slack,
        Jira, Google Workspace, Microsoft, and AWS — with real sync status.
      </p>
    </div>
  );
}
