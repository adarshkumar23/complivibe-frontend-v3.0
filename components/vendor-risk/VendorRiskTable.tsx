"use client";

import { useMemo, useState } from "react";
import { Search, Building, Store, Plus, Pencil, ClipboardList } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { VendorFormModal } from "@/components/vendor-risk/VendorFormModal";
import { VendorAssessmentModal } from "@/components/vendor-risk/VendorAssessmentModal";
import type { Severity } from "@/lib/api/types";
import type { Vendor } from "@/lib/api/vendor-risk";
import type { VendorRiskData } from "@/lib/hooks/useVendorRisk";

const TIER_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const rowActionCls =
  "cv-ring-focus inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-cv-slate ring-1 ring-white/70 transition hover:bg-white hover:text-cv-blue";

export function VendorRiskTable({ data }: { data: VendorRiskData }) {
  const { vendors } = data;
  const list = useMemo(() => vendors.data ?? [], [vendors.data]);

  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [assessVendor, setAssessVendor] = useState<Vendor | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((v) => {
        if (tier !== "all" && v.risk_tier !== tier) return false;
        if (!q) return true;
        return [v.name, v.vendor_type, v.description].filter(Boolean).some((x) => (x as string).toLowerCase().includes(q));
      })
      .sort((a, b) => (TIER_ORDER[a.risk_tier ?? ""] ?? 9) - (TIER_ORDER[b.risk_tier ?? ""] ?? 9));
  }, [list, query, tier]);

  return (
    <SectionCard
      title="Vendor Register"
      subtitle="Third parties ordered by risk tier"
      icon={Building}
      accent="blue"
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {vendors.isSuccess ? (
            <span className="rounded-full bg-cv-brand-soft px-2.5 py-1 text-[11px] font-semibold text-cv-blue ring-1 ring-white/60">
              {list.length} vendors
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setEditVendor(null);
              setFormOpen(true);
            }}
            data-testid="add-vendor"
            className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3.5 py-1.5 text-[12px] font-bold text-white shadow-tile transition hover:opacity-90"
          >
            <Plus size={13} strokeWidth={2.6} /> Add vendor
          </button>
        </div>
      }
    >
      {vendors.isLoading ? (
        <SkeletonRows rows={6} />
      ) : vendors.isError ? (
        <ErrorState title="Unable to load vendors" onRetry={() => vendors.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={Store} title="No vendors registered" description="Add your first vendor to start third-party risk tracking." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/60 px-4 py-2.5 ring-1 ring-white/70 focus-within:ring-cv-blue/40">
              <Search size={16} className="shrink-0 text-cv-mist" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vendors…"
                className="min-w-0 flex-1 bg-transparent text-sm text-cv-ink placeholder:text-cv-mist focus:outline-none"
              />
            </div>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="cv-ring-focus rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
            >
              <option value="all">All tiers</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon={Search} title="No vendors match" description="Try adjusting search or filters." />
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((v) => {
                const flags: string[] = [];
                if (v.processes_personal_data) flags.push("personal data");
                if (v.sub_processor) flags.push("sub-processor");
                if (v.data_access) flags.push("system access");
                return (
                  <li key={v.id} className="group rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/70 transition hover:bg-white/85">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-snug text-cv-ink">{v.name}</p>
                        <p className="mt-0.5 text-[11px] text-cv-slate">
                          {[v.vendor_type?.replaceAll("_", " "), flags.join(", ") || null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                        {v.has_overdue_assessment ? <StatusBadge label="Assessment overdue" tone="bad" /> : null}
                        {v.nth_party_risk_flag ? (
                          <StatusBadge
                            label={`Nth-party ${v.nth_party_risk_severity ?? "risk"}`}
                            tone="warn"
                          />
                        ) : null}
                        {v.risk_tier ? <SeverityBadge severity={v.risk_tier as Severity} /> : null}
                        <button
                          type="button"
                          title={`Edit ${v.name}`}
                          aria-label={`Edit ${v.name}`}
                          data-testid={`edit-vendor-${v.id}`}
                          onClick={() => {
                            setEditVendor(v);
                            setFormOpen(true);
                          }}
                          className={rowActionCls}
                        >
                          <Pencil size={12.5} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          title={`New assessment for ${v.name}`}
                          aria-label={`New assessment for ${v.name}`}
                          data-testid={`assess-vendor-${v.id}`}
                          onClick={() => setAssessVendor(v)}
                          className={rowActionCls}
                        >
                          <ClipboardList size={12.5} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <VendorFormModal open={formOpen} onClose={() => setFormOpen(false)} vendor={editVendor} />
      <VendorAssessmentModal open={assessVendor != null} onClose={() => setAssessVendor(null)} vendor={assessVendor} />
    </SectionCard>
  );
}
