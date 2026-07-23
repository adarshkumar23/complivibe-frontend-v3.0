"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  FileArchive,
  Plus,
  Play,
  ShieldCheck,
  Download,
  Loader2,
  CalendarClock,
  TriangleAlert
} from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { CreateExportModal } from "@/components/exports/CreateExportModal";
import { VerifyResultBadge, AttestationBadge } from "@/components/exports/VerifyResultBadge";
import { useHasPermission } from "@/lib/hooks/usePermissions";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { isExpired, type ExportJobRead, type ExportVerifyResponse } from "@/lib/api/exports";
import {
  useExportJobs,
  useRunExportJob,
  useVerifyExportJob,
  useDownloadExportPackage
} from "@/lib/hooks/useExports";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

type Tone = "good" | "warn" | "bad" | "info" | "neutral" | "purple" | "teal";

function statusTone(status: ExportJobRead["status"]): Tone {
  switch (status) {
    case "completed":
      return "good";
    case "processing":
      return "info";
    case "queued":
      return "neutral";
    case "failed":
      return "bad";
    case "cancelled":
      return "neutral";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

function prettyType(t: string) {
  return t.replace(/_json$/, "").replaceAll("_", " ");
}

/** Validity window cell — valid_from → not_after, with a hard red "Expired" flag once lapsed. */
function ValidityWindow({ job }: { job: ExportJobRead }) {
  const from = formatDate(job.valid_from);
  const to = formatDate(job.not_after);
  const expired = isExpired(job.not_after);

  if (!from && !to) {
    return <span className="text-[12px] text-cv-mist">—</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[12px] font-medium",
          expired ? "text-rose-600" : "text-cv-ink"
        )}
      >
        <CalendarClock size={13} className={expired ? "text-rose-500" : "text-cv-mist"} />
        {from ?? "—"} <span className="text-cv-mist">→</span> {to ?? "—"}
      </span>
      {expired ? (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 ring-1 ring-rose-500/35">
          <TriangleAlert size={10} strokeWidth={2.6} />
          Expired
        </span>
      ) : null}
    </div>
  );
}

function ExportRow({
  job,
  canRun,
  canVerify,
  canDownload
}: {
  job: ExportJobRead;
  canRun: boolean;
  canVerify: boolean;
  canDownload: boolean;
}) {
  const run = useRunExportJob();
  const verify = useVerifyExportJob();
  const download = useDownloadExportPackage();

  const [verifyResult, setVerifyResult] = useState<ExportVerifyResponse | null>(null);
  const [rowError, setRowError] = useState<unknown>(null);

  const isCompleted = job.status === "completed";
  const isQueued = job.status === "queued";

  async function onRun() {
    setRowError(null);
    try {
      await run.mutateAsync(job.id);
    } catch (e) {
      setRowError(e);
    }
  }

  async function onVerify() {
    setRowError(null);
    setVerifyResult(null);
    try {
      const res = await verify.mutateAsync(job.id);
      setVerifyResult(res);
    } catch (e) {
      setRowError(e);
    }
  }

  async function onDownload() {
    setRowError(null);
    try {
      await download.mutateAsync({ id: job.id, filenameBase: job.title || prettyType(job.export_type) });
    } catch (e) {
      setRowError(e);
    }
  }

  return (
    <tr className="border-t border-white/50 align-top transition hover:bg-white/50">
      <td className="px-3 py-3">
        <p className="text-[13px] font-semibold leading-snug text-cv-ink">{job.title || "Untitled export"}</p>
        {job.description ? (
          <p className="mt-0.5 line-clamp-1 max-w-[38ch] text-[11px] text-cv-slate">{job.description}</p>
        ) : null}
        {job.error_message ? (
          <p className="mt-0.5 text-[11px] font-semibold text-rose-600">{job.error_message}</p>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <span className="text-[12px] font-medium capitalize text-cv-slate">{prettyType(job.export_type)}</span>
      </td>
      <td className="px-3 py-3">
        <StatusBadge label={job.status} tone={statusTone(job.status)} />
      </td>
      <td className="px-3 py-3">
        <ValidityWindow job={job} />
      </td>
      <td className="px-3 py-3">
        <AttestationBadge status={job.attestation_status} />
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {isQueued && canRun ? (
              <button
                type="button"
                onClick={onRun}
                disabled={run.isPending}
                className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {run.isPending ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} strokeWidth={2.6} />}
                Run
              </button>
            ) : null}
            {isCompleted && canVerify ? (
              <button
                type="button"
                onClick={onVerify}
                disabled={verify.isPending}
                className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {verify.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <ShieldCheck size={12} strokeWidth={2.4} />
                )}
                Verify
              </button>
            ) : null}
            {isCompleted && canDownload ? (
              <button
                type="button"
                onClick={onDownload}
                disabled={download.isPending}
                className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {download.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Download size={12} strokeWidth={2.4} />
                )}
                Download
              </button>
            ) : null}
          </div>

          {verifyResult ? <VerifyResultBadge result={verifyResult} /> : null}
          {rowError ? (
            <div className="w-full max-w-xs">
              <EntitlementBanner error={rowError} />
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export default function ExportsPage() {
  const jobs = useExportJobs();
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate = useHasPermission("exports:write");
  const canRun = useHasPermission("exports:run");
  const canVerify = useHasPermission("exports:verify");
  const canDownload = useHasPermission("exports:read");

  const list = jobs.data ?? [];

  return (
    <div className="space-y-7">
      {/* Header */}
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
                <FileArchive size={15} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">
                Signed Exports
              </span>
            </div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">
              Exports
            </h1>
            <p className="max-w-2xl text-[15px] text-cv-slate">
              Generate integrity-bound export packages with a checksum, signature, and validity window — then verify or
              download the signed evidence.
            </p>
          </div>

          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="cv-ring-focus inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-cv-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 sm:self-auto"
            >
              <Plus size={15} strokeWidth={2.6} />
              New export
            </button>
          ) : null}
        </div>
      </motion.div>

      {/* Jobs table */}
      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <SectionCard
          title="Export jobs"
          subtitle="Most recent 50 export jobs for your organization"
          icon={FileArchive}
          accent="blue"
          action={
            jobs.isSuccess ? (
              <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
                {list.length} jobs
              </span>
            ) : null
          }
        >
          {jobs.isLoading ? (
            <SkeletonRows rows={6} />
          ) : jobs.isError ? (
            <ErrorState title="Unable to load export jobs" onRetry={() => jobs.refetch()} />
          ) : list.length === 0 ? (
            <EmptyState
              icon={FileArchive}
              title="No exports yet"
              description="Create your first signed export to produce an integrity-bound package you can verify and download."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-[0.12em] text-cv-slate">
                    <th className="px-3 pb-2 font-bold">Export</th>
                    <th className="px-3 pb-2 font-bold">Type</th>
                    <th className="px-3 pb-2 font-bold">Status</th>
                    <th className="px-3 pb-2 font-bold">Validity window</th>
                    <th className="px-3 pb-2 font-bold">Attestation</th>
                    <th className="px-3 pb-2 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((job) => (
                    <ExportRow
                      key={job.id}
                      job={job}
                      canRun={canRun}
                      canVerify={canVerify}
                      canDownload={canDownload}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </motion.div>

      <CreateExportModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
