"use client";

import { useMemo, useState } from "react";
import { Sparkles, Loader2, Check, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { generateReport } from "@/lib/api/reports";
import { ApiError } from "@/lib/api/client";
import { normalizeReports, normalizeReportTemplates } from "@/lib/api/report-normalizers";
import { normalizeFrameworks } from "@/lib/api/compliance-normalizers";
import { normalizeAiSystems } from "@/lib/api/ai-system-normalizers";
import { cn } from "@/lib/utils/cn";
import type { ReportsData } from "@/lib/hooks/useReports";

type State = "idle" | "submitting" | "success" | "error" | "unavailable";

function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function GenerateReport({ data, onGenerated }: { data: ReportsData; onGenerated?: () => void }) {
  const { templates, reports, frameworks, aiSystems } = data;

  const typeOptions = useMemo(() => {
    const fromTemplates = distinct(normalizeReportTemplates(templates.data).map((t) => t.type || t.name));
    return fromTemplates.length ? fromTemplates : distinct(normalizeReports(reports.data).map((r) => r.type));
  }, [templates.data, reports.data]);
  const frameworkOptions = useMemo(() => distinct(normalizeFrameworks(frameworks.data).map((f) => f.name)), [frameworks.data]);
  const systemOptions = useMemo(() => distinct(normalizeAiSystems(aiSystems.data).map((s) => s.name)), [aiSystems.data]);

  const [type, setType] = useState("");
  const [framework, setFramework] = useState("");
  const [aiSystem, setAiSystem] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [incEvidence, setIncEvidence] = useState(true);
  const [incRisks, setIncRisks] = useState(true);
  const [incIncidents, setIncIncidents] = useState(true);
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setMessage(null);
    try {
      await generateReport({
        type: type || null,
        framework: framework || null,
        ai_system: aiSystem || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        include_evidence: incEvidence,
        include_risks: incRisks,
        include_incidents: incIncidents
      });
      setState("success");
      setMessage("Report generation requested.");
      onGenerated?.();
    } catch (err) {
      if (err instanceof ApiError && [404, 405, 501].includes(err.status)) {
        setState("unavailable");
        setMessage("Report generation is not available on this backend yet.");
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

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-cv-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#6366f1]" />
      {label}
    </label>
  );

  return (
    <SectionCard title="Generate Report" subtitle="Create a new audit-ready report" icon={Sparkles} accent="purple" className="h-full">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className={labelCls}>Report type</label>
          <Select value={type} onChange={setType} placeholder="Select type" options={typeOptions} />
        </div>
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
        <div className="flex flex-col gap-2 rounded-xl bg-white/45 p-3 ring-1 ring-white/60">
          <Toggle checked={incEvidence} onChange={setIncEvidence} label="Include evidence" />
          <Toggle checked={incRisks} onChange={setIncRisks} label="Include risks" />
          <Toggle checked={incIncidents} onChange={setIncIncidents} label="Include incidents" />
        </div>

        <button
          type="submit"
          disabled={state === "submitting"}
          className="cv-ring-focus flex w-full items-center justify-center gap-2 rounded-2xl bg-cv-brand py-3 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {state === "submitting" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {state === "submitting" ? "Generating…" : "Generate Report"}
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
