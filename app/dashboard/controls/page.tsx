"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { ControlKpis } from "@/components/controls/ControlKpis";
import { ControlsTable } from "@/components/controls/ControlsTable";
import { ControlTestHealth } from "@/components/controls/ControlTestHealth";
import { CoverageGapPanel } from "@/components/controls/CoverageGapPanel";
import { ControlCreateModal } from "@/components/controls/ControlCreateModal";
import {
  MapObligationModal,
  type ObligationPreset,
  type ControlPreset
} from "@/components/controls/MapObligationModal";
import { LinkPolicyModal } from "@/components/controls/LinkPolicyModal";
import { useControls } from "@/lib/hooks/useControls";
import type { Control } from "@/lib/api/controls";

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 } })
};

export default function ControlsPage() {
  const data = useControls();

  const [createOpen, setCreateOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [obligationPreset, setObligationPreset] = useState<ObligationPreset | null>(null);
  const [controlPreset, setControlPreset] = useState<ControlPreset | null>(null);
  const [policyControl, setPolicyControl] = useState<ControlPreset | null>(null);

  function toControlPreset(c: Control): ControlPreset {
    return { controlId: c.id, title: c.title, controlCode: c.control_code };
  }

  // From the coverage-gap KPI / panel row: obligation side is chosen, pick or create the control.
  function openMapForObligation(preset: ObligationPreset | null) {
    setObligationPreset(preset);
    setControlPreset(null);
    setMapOpen(true);
  }

  // From a control register row: control side is fixed, pick the obligation.
  function openMapForControl(c: Control) {
    setControlPreset(toControlPreset(c));
    setObligationPreset(null);
    setMapOpen(true);
  }

  return (
    <div className="space-y-7">
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
              <ShieldCheck size={15} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Control Assurance</span>
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Controls</h1>
          <p className="max-w-2xl text-[15px] text-cv-slate">
            The control register, obligation coverage gaps, and test health that prove your program actually operates.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fade} custom={1} initial="hidden" animate="show">
        <ControlKpis data={data} onMapGap={() => openMapForObligation(null)} />
      </motion.div>

      <motion.div variants={fade} custom={2} initial="hidden" animate="show">
        <CoverageGapPanel onMap={(preset) => openMapForObligation(preset)} />
      </motion.div>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ControlsTable
            data={data}
            onCreate={() => setCreateOpen(true)}
            onLinkObligation={openMapForControl}
            onLinkPolicy={(c) => setPolicyControl(toControlPreset(c))}
          />
        </div>
        <div>
          <ControlTestHealth data={data} />
        </div>
      </motion.div>

      <ControlCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <MapObligationModal
        open={mapOpen}
        onClose={() => {
          setMapOpen(false);
          setObligationPreset(null);
          setControlPreset(null);
        }}
        obligationPreset={obligationPreset}
        controlPreset={controlPreset}
      />
      <LinkPolicyModal open={policyControl != null} onClose={() => setPolicyControl(null)} control={policyControl} />
    </div>
  );
}
