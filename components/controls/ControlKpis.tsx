"use client";

import { ShieldCheck, Unlink, FlaskConical, TriangleAlert } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import type { ControlsData } from "@/lib/hooks/useControls";

export function ControlKpis({ data }: { data: ControlsData }) {
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
