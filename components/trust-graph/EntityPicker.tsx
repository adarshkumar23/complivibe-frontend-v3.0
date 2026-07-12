"use client";

import { TriangleAlert, Building2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Risk } from "@/lib/api/risks";
import type { Vendor } from "@/lib/api/vendor-risk";

export type EntityKind = "risk" | "vendor";

type EntityPickerProps = {
  kind: EntityKind;
  onKindChange: (kind: EntityKind) => void;
  risks: Risk[];
  vendors: Vendor[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
};

export function EntityPicker({ kind, onKindChange, risks, vendors, selectedId, onSelectId }: EntityPickerProps) {
  const options = kind === "risk" ? risks.map((r) => ({ id: r.id, label: r.title })) : vendors.map((v) => ({ id: v.id, label: v.name }));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/60 p-1 ring-1 ring-white/70">
        <button
          type="button"
          onClick={() => onKindChange("risk")}
          className={cn(
            "cv-ring-focus inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition",
            kind === "risk" ? "bg-cv-brand text-white shadow-tile" : "text-cv-slate hover:text-cv-ink"
          )}
        >
          <TriangleAlert size={13} strokeWidth={2.4} />
          Risk
        </button>
        <button
          type="button"
          onClick={() => onKindChange("vendor")}
          className={cn(
            "cv-ring-focus inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition",
            kind === "vendor" ? "bg-cv-brand text-white shadow-tile" : "text-cv-slate hover:text-cv-ink"
          )}
        >
          <Building2 size={13} strokeWidth={2.4} />
          Vendor
        </button>
      </div>

      <select
        value={selectedId ?? ""}
        onChange={(e) => onSelectId(e.target.value)}
        className="cv-ring-focus min-w-0 flex-1 rounded-full bg-white/60 px-3.5 py-2 text-[13px] font-medium text-cv-ink ring-1 ring-white/70 focus:outline-none"
      >
        <option value="" disabled>
          {options.length === 0 ? `No ${kind}s available` : `Select a ${kind}…`}
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
