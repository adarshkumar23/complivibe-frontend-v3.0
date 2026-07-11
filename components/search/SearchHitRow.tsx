"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { IconTile } from "@/components/ui/IconTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { searchHitMeta, searchHitTitle, type SearchHit } from "@/lib/api/search";

function hitBadges(hit: SearchHit): { label: string; tone: "good" | "warn" | "bad" | "info" | "neutral" }[] {
  const badges: { label: string; tone: "good" | "warn" | "bad" | "info" | "neutral" }[] = [];
  const sev = hit.severity ?? hit.criticality ?? hit.risk_tier;
  if (sev) {
    badges.push({
      label: sev.replace(/_/g, " "),
      tone: /critical|high/i.test(sev) ? "bad" : /medium/i.test(sev) ? "warn" : "neutral"
    });
  }
  if (hit.status) {
    badges.push({
      label: hit.status.replace(/_/g, " "),
      tone: /active|approved|implemented|resolved|closed/i.test(hit.status)
        ? "good"
        : /draft|open|not_started|pending/i.test(hit.status)
          ? "info"
          : "neutral"
    });
  }
  return badges;
}

/** One search result row — used by both the topbar dropdown and the results page. */
export function SearchHitRow({ hit, compact = false, onNavigate }: { hit: SearchHit; compact?: boolean; onNavigate?: () => void }) {
  const meta = searchHitMeta(hit);
  const subtitle = [meta.label, hit.control_code, hit.reference_code, hit.jurisdiction, hit.category, hit.vendor_type, hit.issue_type, hit.policy_type]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={meta.href}
      onClick={onNavigate}
      data-search-hit={hit.entity_type}
      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-white/70"
    >
      <IconTile icon={meta.icon} accent={meta.accent} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-cv-ink">{searchHitTitle(hit)}</p>
        <p className="truncate text-[11.5px] text-cv-slate">{subtitle}</p>
        {!compact && hit.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-cv-slate">{hit.description}</p>
        ) : null}
      </div>
      {!compact ? (
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {hitBadges(hit).map((b) => (
            <StatusBadge key={b.label} label={b.label} tone={b.tone} />
          ))}
        </div>
      ) : null}
      <ArrowUpRight size={15} className="shrink-0 text-cv-mist transition group-hover:text-cv-ink" />
    </Link>
  );
}
