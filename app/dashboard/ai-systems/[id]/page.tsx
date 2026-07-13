"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { BrainCircuit, Link2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { getAiSystem } from "@/lib/api/ai-systems";
import { apiFetch } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/utils/format";

type LinksSummary = {
  active_control_links: number;
  active_evidence_links: number;
  active_risk_links: number;
  total_active_links: number;
  total_unlinked_links: number;
};

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function AiSystemDetailPage() {
  const params = useParams();
  const raw = params?.id;
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null;

  const system = useQuery({
    queryKey: ["ai-system", id],
    queryFn: () => getAiSystem(id as string),
    enabled: id != null
  });
  const links = useQuery({
    queryKey: ["ai-system-links", id],
    queryFn: () => apiFetch<LinksSummary>(`/api/v1/ai-systems/${id}/links/summary`),
    enabled: id != null
  });

  const s = system.data;

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <BrainCircuit size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">AI System</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
            {s?.name ?? "AI System"}
          </h1>
          {s?.intended_purpose ? <p className="max-w-2xl text-[15px] text-cv-slate">{s.intended_purpose}</p> : null}
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Profile" subtitle="Registry record" icon={BrainCircuit} accent="purple">
          {system.isLoading ? (
            <SkeletonRows rows={5} />
          ) : system.isError ? (
            <ErrorState compact title="Unable to load system" onRetry={() => system.refetch()} />
          ) : s ? (
            <ul className="space-y-2.5">
              {[
                ["Type", s.system_type.replaceAll("_", " ")],
                ["Lifecycle", s.lifecycle_status.replaceAll("_", " ")],
                ["Environment", s.deployment_environment ?? "—"],
                ["Model", [s.model_name, s.model_version].filter(Boolean).join(" ") || "—"],
                ["Vendor / provider", [s.vendor_name, s.provider_name].filter(Boolean).join(" / ") || "—"],
                ["Updated", formatRelativeTime(s.updated_at) ?? s.updated_at]
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                  <span className="text-[13px] font-semibold text-cv-ink">{label}</span>
                  <span className="text-[12px] font-medium text-cv-slate">{value}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>

        <SectionCard title="Governance Links" subtitle="Controls, evidence, and risks tied to this system" icon={Link2} accent="teal">
          {links.isLoading ? (
            <SkeletonRows rows={3} />
          ) : links.isError ? (
            <ErrorState compact title="Unable to load links" onRetry={() => links.refetch()} />
          ) : links.data ? (
            <ul className="space-y-2.5">
              {[
                ["Linked controls", links.data.active_control_links],
                ["Linked evidence", links.data.active_evidence_links],
                ["Linked risks", links.data.active_risk_links]
              ].map(([label, value]) => (
                <li key={String(label)} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
                  <span className="text-[13px] font-semibold text-cv-ink">{label}</span>
                  <StatusBadge label={String(value)} tone={Number(value) > 0 ? "info" : "neutral"} />
                </li>
              ))}
              {links.data.total_active_links === 0 ? (
                <li className="pt-1 text-[11px] font-medium text-amber-600">
                  Ungoverned system: no controls, evidence, or risks are linked yet.
                </li>
              ) : null}
            </ul>
          ) : null}
        </SectionCard>
      </motion.div>
    </div>
  );
}
