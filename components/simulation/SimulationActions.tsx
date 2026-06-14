"use client";

import { Play, Save, Download, ListPlus, type LucideIcon } from "lucide-react";

function DisabledAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button type="button" disabled title="Simulation endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-3.5 py-2 text-[12px] font-semibold text-cv-mist ring-1 ring-white/60">
      <Icon size={13} /> {label}
    </button>
  );
}

export function SimulationActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DisabledAction icon={Play} label="Run simulation" />
      <DisabledAction icon={Save} label="Save scenario" />
      <DisabledAction icon={Download} label="Export result" />
      <DisabledAction icon={ListPlus} label="Create task" />
    </div>
  );
}
