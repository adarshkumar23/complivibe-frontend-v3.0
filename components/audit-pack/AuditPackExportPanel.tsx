"use client";

import { useMemo, useState } from "react";
import { Loader2, Package, Download, ShieldCheck, FileArchive } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { VerifyResultBadge } from "@/components/exports/VerifyResultBadge";
import { formatDate } from "@/lib/utils/format";
import { type ExportJobRead, type ExportVerifyResponse } from "@/lib/api/exports";
import {
  useExportJobs,
  useCreateExportJob,
  useRunExportJob,
  useVerifyExportJob,
  useDownloadExportPackage
} from "@/lib/hooks/useExports";
import { useHasPermission } from "@/lib/hooks/usePermissions";

// The "audit pack" is the audit_preparation_json export type built + signed by the
// shared exports pipeline; this panel is a focused view of those jobs on the
// audit-pack page (reusing the exports hooks, not duplicating the run/verify logic).
const AUDIT_PACK_EXPORT_TYPE = "audit_preparation_json";

function statusTone(status: ExportJobRead["status"]): "good" | "warn" | "bad" | "neutral" | "info" {
  switch (status) {
    case "completed": return "good";
    case "processing": case "queued": return "warn";
    case "failed": return "bad";
    default: return "neutral";
  }
}

function AuditPackJobRow({ job, canVerify, canDownload }: { job: ExportJobRead; canVerify: boolean; canDownload: boolean }) {
  const verify = useVerifyExportJob();
  const download = useDownloadExportPackage();
  const [verifyResult, setVerifyResult] = useState<ExportVerifyResponse | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const isCompleted = job.status === "completed";

  async function onDownload() {
    setRowError(null);
    try {
      await download.mutateAsync({ id: job.id, filenameBase: job.title || "audit-pack" });
    } catch (e) {
      setRowError(e instanceof ApiError ? e.message : "Download failed.");
    }
  }
  async function onVerify() {
    setRowError(null);
    setVerifyResult(null);
    try {
      setVerifyResult(await verify.mutateAsync(job.id));
    } catch (e) {
      setRowError(e instanceof ApiError ? e.message : "Verify failed.");
    }
  }

  return (
    <li className="rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70" data-testid={`audit-pack-job-${job.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-cv-ink">{job.title || "Audit preparation pack"}</p>
          <p className="mt-0.5 text-[11px] text-cv-mist">
            {job.completed_at ? `Built ${formatDate(job.completed_at) ?? job.completed_at}` : `Created ${formatDate(job.created_at) ?? job.created_at}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span data-testid={`audit-pack-job-status-${job.id}`}><StatusBadge label={job.status} tone={statusTone(job.status)} /></span>
        </div>
      </div>
      {isCompleted ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {canDownload ? (
            <button
              type="button"
              data-testid={`audit-pack-download-${job.id}`}
              onClick={onDownload}
              disabled={download.isPending}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70"
            >
              {download.isPending ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} strokeWidth={2.6} />}
              Download
            </button>
          ) : null}
          {canVerify ? (
            <button
              type="button"
              data-testid={`audit-pack-verify-${job.id}`}
              onClick={onVerify}
              disabled={verify.isPending}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:opacity-70"
            >
              {verify.isPending ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} strokeWidth={2.6} />}
              Verify
            </button>
          ) : null}
          {verifyResult ? <VerifyResultBadge result={verifyResult} /> : null}
        </div>
      ) : null}
      {rowError ? <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{rowError}</p> : null}
    </li>
  );
}

export function AuditPackExportPanel() {
  const jobsQuery = useExportJobs();
  const create = useCreateExportJob();
  const run = useRunExportJob();
  const canWrite = useHasPermission("exports:write");
  const canRun = useHasPermission("exports:run");
  const canVerify = useHasPermission("exports:verify");
  const canDownload = useHasPermission("exports:read");
  const [genError, setGenError] = useState<string | null>(null);

  const packs = useMemo(
    () => (jobsQuery.data ?? []).filter((j) => j.export_type === AUDIT_PACK_EXPORT_TYPE),
    [jobsQuery.data]
  );
  const busy = create.isPending || run.isPending;

  async function onGenerate() {
    setGenError(null);
    try {
      const job = await create.mutateAsync({
        export_type: AUDIT_PACK_EXPORT_TYPE,
        title: `Audit pack — ${new Date().toISOString().slice(0, 10)}`
      });
      // Build + sign immediately so the pack is downloadable once ready.
      if (canRun) await run.mutateAsync(job.id);
    } catch (e) {
      setGenError(e instanceof ApiError ? e.message : "Could not generate the audit pack.");
    }
  }

  const err = (create.error ?? run.error) instanceof ApiError ? ((create.error ?? run.error) as ApiError) : null;

  return (
    <SectionCard
      title="Audit Pack Export"
      subtitle="Bundle the audit-ready evidence pack, signed and verifiable, for your auditor"
      icon={FileArchive}
      accent="blue"
      action={
        canWrite ? (
          <button
            type="button"
            data-testid="audit-pack-generate"
            onClick={onGenerate}
            disabled={busy}
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Package size={12} strokeWidth={2.6} />}
            Generate Pack
          </button>
        ) : null
      }
    >
      {genError ? <p className="mb-3 rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">{genError}</p> : null}
      <EntitlementBanner error={err} />
      {packs.length === 0 ? (
        <EmptyState
          compact
          icon={FileArchive}
          title="No audit packs yet"
          description={canWrite ? "Generate a signed audit pack to hand to your auditor." : "Audit packs will appear here once generated."}
        />
      ) : (
        <ul className="space-y-2.5" data-testid="audit-pack-job-list">
          {packs.map((job) => (
            <AuditPackJobRow key={job.id} job={job} canVerify={canVerify} canDownload={canDownload} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
