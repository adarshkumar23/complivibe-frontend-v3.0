"use client";

import { Link2, FolderOpen } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeEvidenceItems } from "@/lib/api/evidence-normalizers";
import { formatDate } from "@/lib/utils/format";
import type { VendorRiskData } from "@/lib/hooks/useVendorRisk";

const VENDOR_MATCH = /vendor|third[\s-]?party|supplier|contract|dpa|sub[\s-]?processor|procurement/i;

export function VendorEvidenceLinkage({ data }: { data: VendorRiskData }) {
  const { evidence } = data;
  // Real vendor-related evidence only: items whose type/title/control mention vendor concepts.
  const items = normalizeEvidenceItems(evidence.data).filter((e) =>
    [e.type, e.title, e.control].some((v) => v && VENDOR_MATCH.test(v))
  );

  return (
    <SectionCard title="Vendor Evidence" subtitle="Third-party documents from the evidence vault" icon={Link2} accent="green" className="h-full">
      {evidence.isLoading ? (
        <SkeletonRows rows={4} />
      ) : evidence.isError ? (
        <ErrorState compact title="Unable to load evidence" onRetry={() => evidence.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={FolderOpen} title="Vendor evidence mapping unavailable from backend." description="Vendor, contract, and DPA evidence will appear here once the backend tags it." />
      ) : (
        <ul className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
          {items.slice(0, 10).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 px-3 py-2.5 ring-1 ring-white/60">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-cv-ink">{e.title}</p>
                <p className="truncate text-[11px] text-cv-slate">
                  {[e.type, e.updatedAt ? `Updated ${formatDate(e.updatedAt)}` : null].filter(Boolean).join(" · ") || "No metadata"}
                </p>
              </div>
              {e.status ? <StatusBadge label={e.status} tone="info" /> : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
