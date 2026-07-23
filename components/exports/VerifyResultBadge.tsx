"use client";

import {
  BadgeCheck,
  CalendarX2,
  Ban,
  FileWarning,
  ShieldX,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AttestationStatus, ExportVerifyResponse, VerifyReason } from "@/lib/api/exports";

type Tone = "good" | "warn" | "bad" | "info" | "neutral" | "purple" | "teal";

/**
 * Distinct, non-ambiguous visual states for a verify result. An expired or revoked
 * export MUST never look like a valid one — only "valid" is green; every failure is
 * amber/red with its own icon and label.
 */
const REASON_STYLE: Record<
  VerifyReason,
  { label: string; icon: LucideIcon; classes: string }
> = {
  valid: {
    label: "Valid",
    icon: BadgeCheck,
    classes: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/30"
  },
  expired: {
    label: "Expired",
    icon: CalendarX2,
    classes: "bg-amber-500/15 text-amber-700 ring-amber-500/35"
  },
  revoked: {
    label: "Revoked",
    icon: Ban,
    classes: "bg-rose-500/15 text-rose-700 ring-rose-500/35"
  },
  invalid_signature: {
    label: "Invalid signature",
    icon: ShieldX,
    classes: "bg-rose-500/15 text-rose-700 ring-rose-500/35"
  },
  checksum_mismatch: {
    label: "Checksum mismatch (tampered)",
    icon: FileWarning,
    classes: "bg-rose-500/15 text-rose-700 ring-rose-500/35"
  }
};

function resolveReason(result: ExportVerifyResponse): VerifyReason {
  const r = result.reason;
  if (r && r in REASON_STYLE) return r as VerifyReason;
  // Fall back defensively from the boolean flags so a failure never renders as valid.
  if (result.revoked) return "revoked";
  if (result.expired) return "expired";
  if (result.signature_match === false) return "invalid_signature";
  if (result.checksum_match === false) return "checksum_mismatch";
  return result.valid ? "valid" : "invalid_signature";
}

/** Compact pill for a completed verify result. */
export function VerifyResultBadge({
  result,
  className
}: {
  result: ExportVerifyResponse;
  className?: string;
}) {
  const style = REASON_STYLE[resolveReason(result)];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1",
        style.classes,
        className
      )}
    >
      <Icon size={13} strokeWidth={2.4} />
      {style.label}
    </span>
  );
}

/**
 * Attestation status badge. Revoked attestation renders red so it can never be
 * confused with an attested/valid export.
 */
export function AttestationBadge({ status }: { status: AttestationStatus }) {
  const map: Record<AttestationStatus, { label: string; tone: Tone }> = {
    unattested: { label: "Unattested", tone: "neutral" },
    attested: { label: "Attested", tone: "good" },
    revoked: { label: "Attestation revoked", tone: "bad" }
  };
  const { label, tone } = map[status] ?? map.unattested;
  return <StatusBadge label={label} tone={tone} />;
}
