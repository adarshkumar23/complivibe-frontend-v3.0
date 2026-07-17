"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { generateReport } from "@/lib/api/reports";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import type { ReportsData } from "@/lib/hooks/useReports";

const CORE_TYPES = [
  { value: "executive_summary", label: "Executive summary" },
  { value: "framework_readiness", label: "Framework readiness" },
  { value: "risk_posture", label: "Risk posture" }
];

/** POST /api/v1/reports/generate with a backend-supported report type. */
export function GenerateReport({ data }: { data: ReportsData }) {
  const [reportType, setReportType] = useState(CORE_TYPES[0].value);
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  // Gate report generation on reports:generate (mirrors risks gating);
  // backend enforces the same, so an ungated button would 403.
  const canGenerate = useHasPermission("reports:generate");

  async function handleGenerate() {
    setState("working");
    setMessage(null);
    try {
      await generateReport({ report_type: reportType });
      setState("done");
      setMessage("Report generated.");
      data.reports.refetch();
      data.summary.refetch();
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Generation failed.");
    }
  }

  return (
    <SectionCard title="Generate Report" subtitle="Create a fresh snapshot now" icon={Sparkles} accent="teal">
      <div className="space-y-3">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          aria-label="Report type"
          className="cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
        >
          {CORE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {canGenerate ? (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={state === "working"}
            className="cv-ring-focus inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cv-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {state === "working" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {state === "working" ? "Generating…" : "Generate"}
          </button>
        ) : (
          <p className="text-[11px] text-cv-mist">You do not have permission to generate reports.</p>
        )}
        {message ? (
          <p
            className={`flex items-center gap-1.5 text-[12px] font-medium ${
              state === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {state === "error" ? <TriangleAlert size={13} /> : <CheckCircle2 size={13} />}
            {message}
          </p>
        ) : null}
      </div>
    </SectionCard>
  );
}
