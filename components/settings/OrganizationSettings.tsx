"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, Check, TriangleAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { updateOrganization } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import { normalizeOrganization } from "@/lib/api/settings-normalizers";
import { cn } from "@/lib/utils/cn";
import type { SettingsData } from "@/lib/hooks/useSettings";

type State = "idle" | "saving" | "success" | "error" | "unavailable";

const FIELDS: { key: keyof ReturnType<typeof normalizeOrganization>; label: string; payloadKey: string }[] = [
  { key: "companyName", label: "Company name", payloadKey: "company_name" },
  { key: "website", label: "Website", payloadKey: "website" },
  { key: "industry", label: "Industry", payloadKey: "industry" },
  { key: "country", label: "Country / region", payloadKey: "country" },
  { key: "complianceRegion", label: "Compliance region", payloadKey: "compliance_region" },
  { key: "defaultFramework", label: "Default framework", payloadKey: "default_framework" },
  { key: "dataRetention", label: "Data retention", payloadKey: "data_retention" }
];

export function OrganizationSettings({ data }: { data: SettingsData }) {
  const { organization, settings } = data;
  const org = normalizeOrganization(organization.data, settings.data);
  const hasAny = Object.values(org).some(Boolean);

  const [form, setForm] = useState<Record<string, string>>({});
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const f of FIELDS) next[f.key] = (org[f.key] as string | null) ?? "";
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization.data, settings.data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setMessage(null);
    const payload: Record<string, unknown> = {};
    for (const f of FIELDS) if (form[f.key]) payload[f.payloadKey] = form[f.key];
    try {
      await updateOrganization(payload);
      setState("success");
      setMessage("Organization settings saved.");
      organization.refetch();
    } catch (err) {
      if (err instanceof ApiError && [404, 405, 501].includes(err.status)) {
        setState("unavailable");
        setMessage("Saving organization settings is not available on this backend yet.");
      } else {
        setState("error");
        setMessage(err instanceof ApiError ? err.message : "Save failed. Please try again.");
      }
    }
  }

  const fieldCls = "cv-ring-focus w-full rounded-xl bg-white/65 px-3 py-2 text-[13px] text-cv-ink ring-1 ring-white/70 focus:outline-none";

  return (
    <SectionCard title="Organization Settings" subtitle="Company & compliance preferences" icon={Building2} accent="purple" className="h-full">
      {organization.isLoading ? (
        <SkeletonRows rows={5} />
      ) : organization.isError && !hasAny ? (
        <ErrorState title="Unable to load organization" onRetry={() => organization.refetch()} />
      ) : !hasAny ? (
        <EmptyState icon={Building2} title="No organization data" description="Organization fields will appear here once the backend returns them." />
      ) : (
        <form onSubmit={handleSave} className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-[12px] font-semibold text-cv-slate">{f.label}</label>
              <input value={form[f.key] ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} className={fieldCls} />
            </div>
          ))}
          <button
            type="submit"
            disabled={state === "saving"}
            className="cv-ring-focus flex w-full items-center justify-center gap-2 rounded-2xl bg-cv-brand py-3 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70"
          >
            {state === "saving" ? <Loader2 size={16} className="animate-spin" /> : null}
            {state === "saving" ? "Saving…" : "Save changes"}
          </button>
          {state !== "idle" && state !== "saving" && message ? (
            <p className={cn("flex items-center gap-1.5 text-[12px] font-medium", state === "success" ? "text-emerald-600" : state === "unavailable" ? "text-amber-600" : "text-rose-600")}>
              {state === "success" ? <Check size={13} /> : <TriangleAlert size={13} />}
              {message}
            </p>
          ) : null}
        </form>
      )}
    </SectionCard>
  );
}
