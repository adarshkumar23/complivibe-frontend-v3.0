"use client";

import { useRouter } from "next/navigation";
import { Zap, ClipboardCheck, Play, Pause, Download, type LucideIcon } from "lucide-react";

function NavAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-2 text-[12px] font-bold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
      <Icon size={13} /> {label}
    </button>
  );
}

function DisabledAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button type="button" disabled title="Action endpoint unavailable" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-white/55 px-3.5 py-2 text-[12px] font-semibold text-cv-mist ring-1 ring-white/60">
      <Icon size={13} /> {label}
    </button>
  );
}

export function AgentsActions() {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NavAction icon={Zap} label="Automation" onClick={() => router.push("/dashboard/automation")} />
      <NavAction icon={ClipboardCheck} label="Assurance" onClick={() => router.push("/dashboard/assurance")} />
      <DisabledAction icon={Play} label="Run agent" />
      <DisabledAction icon={Pause} label="Pause agent" />
      <DisabledAction icon={Download} label="Export agent report" />
    </div>
  );
}
