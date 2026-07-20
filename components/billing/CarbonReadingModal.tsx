"use client";

import { useEffect, useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { EMISSION_UNITS, SCOPE3_CATEGORIES, type CarbonReadingPayload } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";
import { useIngestCarbonReading } from "@/lib/hooks/useBilling";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-cv-slate";
const inputCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none";
const selectCls =
  "cv-ring-focus w-full rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none";

const SCOPES = ["scope1", "scope2", "scope3"] as const;

/**
 * Manual emissions reading entry (POST /api/v1/carbon-accounting/readings/manual).
 * Authenticates via the signed-in user's session (cookie + CSRF) and the
 * carbon_accounting:write permission — no machine ingest key touches the browser.
 * Scope 3 readings must carry one of the 15 GHG Protocol categories.
 */
export function CarbonReadingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ingest = useIngestCarbonReading();

  const [scope, setScope] = useState<(typeof SCOPES)[number]>("scope2");
  const [scope3Category, setScope3Category] = useState<string>(SCOPE3_CATEGORIES[0]);
  const [source, setSource] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<(typeof EMISSION_UNITS)[number]>("tCO2e");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    ingest.reset();
    setScope("scope2");
    setScope3Category(SCOPE3_CATEGORIES[0]);
    setSource("");
    setPeriodStart("");
    setPeriodEnd("");
    setValue("");
    setUnit("tCO2e");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      setError("Value must be a non-negative number.");
      return;
    }
    const payload: CarbonReadingPayload = {
      scope,
      scope3_category: scope === "scope3" ? scope3Category : null,
      source: source.trim(),
      period_start: periodStart,
      period_end: periodEnd,
      value: num,
      unit
    };
    try {
      await ingest.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed — the backend may be unavailable.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Emissions Reading"
      subtitle="GHG Protocol scoped reading for ESG accounting"
      icon={Leaf}
      accent="green"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cr-scope" className={labelCls}>
              Scope
            </label>
            <select
              id="cr-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as (typeof SCOPES)[number])}
              className={selectCls}
            >
              {SCOPES.map((s) => (
                <option key={s} value={s}>
                  {s === "scope1" ? "Scope 1 — direct" : s === "scope2" ? "Scope 2 — purchased energy" : "Scope 3 — value chain"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cr-source" className={labelCls}>
              Source
            </label>
            <input
              id="cr-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
              minLength={1}
              maxLength={120}
              placeholder="e.g. grid_electricity_hq"
              className={inputCls}
            />
          </div>
        </div>

        {scope === "scope3" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cr-cat" className={labelCls}>
              Scope 3 category (GHG Protocol)
            </label>
            <select id="cr-cat" value={scope3Category} onChange={(e) => setScope3Category(e.target.value)} className={selectCls}>
              {SCOPE3_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cr-start" className={labelCls}>
              Period start
            </label>
            <input id="cr-start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cr-end" className={labelCls}>
              Period end
            </label>
            <input id="cr-end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cr-value" className={labelCls}>
              Value
            </label>
            <input
              id="cr-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              inputMode="decimal"
              placeholder="e.g. 12.4"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cr-unit" className={labelCls}>
              Unit
            </label>
            <select id="cr-unit" value={unit} onChange={(e) => setUnit(e.target.value as (typeof EMISSION_UNITS)[number])} className={selectCls}>
              {EMISSION_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p role="alert" className={cn("rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-400/25")}>
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
            disabled={ingest.isPending}
            className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2 text-[13px] font-semibold text-white shadow-tile transition hover:opacity-90 disabled:opacity-60"
          >
            {ingest.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Record reading
          </button>
        </div>
      </form>
    </Modal>
  );
}
