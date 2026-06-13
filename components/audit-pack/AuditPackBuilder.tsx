"use client";

import { useMemo, useState } from "react";
import { PackagePlus, Loader2, Check, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { generateAuditPack } from "@/lib/api/audit-pack";
import { ApiError } from "@/lib/api/client";
import { normalizeFrameworks } from "@/lib/api/compliance-normalizers";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import { cn } from "@/lib/utils/cn";
import type { AuditPackData } from "@/lib/hooks/useAuditPack";

type State = "idle" | "submitting" | "success" | "error" | "unavailable";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function AuditPackBuilder({ data, onGenerated }: { data: AuditPackData; onGenerated?: () => void }) {
  const { frameworks, aiSystems } = data;
  const frameworkOptions = useMemo(() => distinct(normalizeFrameworks(frameworks.data).map((f) => f.name)), [frameworks.data]);
  const systemOptions = useMemo(() => distinct(normalizeAiSystems(aiSystems.data).map((s) => s.name)), [aiSystems.data]);

  const [framework, setFramework] = useState("");
  const [aiSystem, setAiSystem] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [inc, setInc] = useState({
    evidence: true,
    reports: true,
    risks: true,
    incidents: true,
    modelCards: false,
    governanceScores: true
  });
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setMessage(null);
    try {
      await generateAuditPack({
        framework: framework || null,
        ai_system: aiSystem || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        include_evidence: inc.evidence,
        include_reports: inc.reports,
        include_risks: inc.risks,
        include_incidents: inc.incidents,
        include_model_cards: inc.modelCards,
        include_governance_scores: inc.governanceScores
      });
      setState("success");
      setMessage("Audit pack generation requested.");
      onGenerated?.();
    } catch (err) {
      if (err instanceof ApiError && [404, 405, 501].includes(err.status)) {
        setState("unavailable");
        setMessage("Audit pack generation is not available on this backend yet.");
      } else {
        setState("error");
        setMessage(err instanceof ApiError ? err.message : "Generation failed. Please try again.");
      }
    }
  }

  const fieldCls = "cv-ring-focus w-full rounded-xl bg-white/65 px-3 py-2 text-[13px] text-cv-ink ring-1 ring-white/70 focus:outline-none";
  const labelCls = "mb-1 block text-[12px] font-semibold text-cv-slate";

  const Select = ({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[] }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldCls} disabled={options.length === 0}>
      <option value="">{options.length === 0 ? "None available" : placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );

  const toggles: { key: keyof typeof inc; label: string }[] = [
    { key: "evidence", label: "Include evidence" },
    { key: "reports", label: "Include reports" },
    { key: "risks", label: "Include risks" },
    { key: "incidents", label: "Include incidents" },
    { key: "modelCards", label: "Include model cards" },
    { key: "governanceScores", label: "Include governance scores" }
  ];

  return (
    <SectionCard title="Audit Pack Builder" subtitle="Bundle a new review pack" icon={PackagePlus} accent="purple" className="h-full">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className={labelCls}>Framework</label>
          <Select value={framework} onChange={setFramework} placeholder="Select framework" options={frameworkOptions} />
        </div>
        <div>
          <label className={labelCls}>AI system</label>
          <Select value={aiSystem} onChange={setAiSystem} placeholder="All systems" options={systemOptions} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={labelCls}>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={fieldCls} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 rounded-xl bg-white/45 p-3 ring-1 ring-white/60 sm:grid-cols-2">
          {toggles.map((t) => (
            <label key={t.key} className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-cv-ink">
              <input
                type="checkbox"
                checked={inc[t.key]}
                onChange={(e) => setInc((prev) => ({ ...prev, [t.key]: e.target.checked }))}
                className="h-4 w-4 accent-[#6366f1]"
              />
              {t.label}
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={state === "submitting"}
          className="cv-ring-focus flex w-full items-center justify-center gap-2 rounded-2xl bg-cv-brand py-3 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {state === "submitting" ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />}
          {state === "submitting" ? "Generating…" : "Generate Audit Pack"}
        </button>

        {state !== "idle" && state !== "submitting" && message ? (
          <p
            className={cn(
              "flex items-center gap-1.5 text-[12px] font-medium",
              state === "success" ? "text-emerald-600" : state === "unavailable" ? "text-amber-600" : "text-rose-600"
            )}
          >
            {state === "success" ? <Check size={13} /> : <TriangleAlert size={13} />}
            {message}
          </p>
        ) : null}
      </form>
    </SectionCard>
  );
}
