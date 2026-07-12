"use client";

import { ShieldCheck, Unlink, FlaskConical, TriangleAlert, Link2 } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { ControlsData } from "@/lib/hooks/useControls";

export function ControlKpis({ data, onMapGap }: { data: ControlsData; onMapGap?: () => void }) {
  const { gaps, tests } = data;
  const g = gaps.data;
  const t = tests.data;

  const totalControls = g != null ? g.controls_not_started + g.controls_in_progress + g.controls_implemented : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi
        label="Controls Implemented"
        icon={ShieldCheck}
        accent="green"
        value={g ? g.controls_implemented : null}
        caption={totalControls != null ? `of ${totalControls} controls` : undefined}
        loading={gaps.isLoading}
        unavailableHint="Control summary unavailable"
      />
      <RegistryKpi
        label="Obligations Without Controls"
        icon={Unlink}
        accent="amber"
        value={g ? g.obligations_without_controls : null}
        caption={
          g
            ? `${g.obligations_with_controls} of ${g.total_active_obligations} obligations covered`
            : undefined
        }
        loading={gaps.isLoading}
        unavailableHint="Gap summary unavailable"
        action={
          onMapGap && g && g.obligations_without_controls > 0 ? (
            <button
              type="button"
              onClick={onMapGap}
              className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-400/25 transition hover:-translate-y-0.5 hover:bg-amber-500/20"
            >
              <Link2 size={12} strokeWidth={2.6} />
              Map this
            </button>
          ) : null
        }
      />
      <RegistryKpi
        label="High-Criticality Open"
        icon={TriangleAlert}
        accent="red"
        value={g ? g.high_criticality_open_controls : null}
        caption={g && g.high_criticality_open_controls > 0 ? "implement these first" : g ? "none open" : undefined}
        loading={gaps.isLoading}
        unavailableHint="Gap summary unavailable"
      />
      <RegistryKpi
        label="Controls Without Tests"
        icon={FlaskConical}
        accent="purple"
        value={t ? t.controls_without_tests : null}
        caption={
          t
            ? t.tests_overdue > 0
              ? `${t.tests_overdue} tests overdue`
              : `${t.active_tests} active tests`
            : undefined
        }
        loading={tests.isLoading}
        unavailableHint="Test summary unavailable"
      />
    </div>
  );
}
