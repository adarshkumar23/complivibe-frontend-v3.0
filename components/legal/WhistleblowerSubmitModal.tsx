"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Megaphone, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { WHISTLEBLOWER_CATEGORIES, type WhistleblowerCategory, type WhistleblowerSubmitResponse } from "@/lib/api/legal";
import { ApiError } from "@/lib/api/client";
import { useSubmitWhistleblowerReport } from "@/lib/hooks/useLegal";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

/**
 * Anonymous report submission (POST /api/v1/whistleblower/submit). The backend
 * returns a one-time tracking code — shown prominently after submission because
 * it is the reporter's ONLY way to follow up anonymously.
 */
export function WhistleblowerSubmitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const submitReport = useSubmitWhistleblowerReport();

  const [category, setCategory] = useState<WhistleblowerCategory>("other");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<WhistleblowerSubmitResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setResult(null);
    setCopied(false);
    submitReport.reset();
    setCategory("other");
    setDescription("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await submitReport.mutateAsync({ category, description: description.trim() });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Submission failed.");
    }
  };

  const copyCode = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tracking_code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit Anonymous Report"
      subtitle="Filed without identity — keep the tracking code"
      icon={Megaphone}
      accent="amber"
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-5 text-center ring-1 ring-emerald-500/20">
            <ShieldCheck size={22} className="text-emerald-600" />
            <p className="text-sm font-bold text-cv-ink">Report filed anonymously</p>
            <p className="text-xs text-cv-slate">
              Save this tracking code now — it is shown only once and is the only way to check status or reply
              anonymously.
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded-xl bg-white/70 px-3.5 py-2 text-sm font-bold tracking-wider text-cv-ink ring-1 ring-white/70">
                {result.tracking_code}
              </code>
              <button
                type="button"
                onClick={copyCode}
                className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-2 text-xs font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink"
              >
                <Copy size={13} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {result.warning ? (
              <p className="mt-1 text-[11px] font-semibold text-amber-600">{result.warning}</p>
            ) : null}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="cv-ring-focus rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="wb-category" className={labelCls}>
              Category
            </label>
            <select
              id="wb-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as WhistleblowerCategory)}
              className={selectCls}
            >
              {WHISTLEBLOWER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="wb-desc" className={labelCls}>
              What happened?
            </label>
            <textarea
              id="wb-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={1}
              maxLength={10000}
              rows={5}
              placeholder="Describe the concern. Do not include your name or identifying details if you wish to remain anonymous."
              className={cn(inputCls, "resize-y")}
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25">
              {error}
            </p>
          ) : null}

          <div className="mt-1 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="cv-ring-focus rounded-full bg-white/60 px-4 py-2 text-[13px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitReport.isPending}
              className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
            >
              {submitReport.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit report
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
