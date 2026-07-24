"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { ControlKpis } from "@/components/controls/ControlKpis";
import { ControlsTable } from "@/components/controls/ControlsTable";
import { ControlTestHealth } from "@/components/controls/ControlTestHealth";
import { CoverageGapPanel } from "@/components/controls/CoverageGapPanel";
import { ControlCreateModal } from "@/components/controls/ControlCreateModal";
import { ControlEditModal } from "@/components/controls/ControlEditModal";
import {
  MapObligationModal,
  type ObligationPreset,
  type ControlPreset
} from "@/components/controls/MapObligationModal";
import { LinkPolicyModal } from "@/components/controls/LinkPolicyModal";
import { AttachEvidenceModal } from "@/components/evidence/AttachEvidenceModal";
import { Modal } from "@/components/ui/Modal";
import { Archive, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { EntitlementBanner } from "@/components/common/EntitlementBanner";
import { useControls, useArchiveControl } from "@/lib/hooks/useControls";
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
  const [attachEvidenceControl, setAttachEvidenceControl] = useState<Control | null>(null);
  const [editControl, setEditControl] = useState<Control | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Control | null>(null);
  const archive = useArchiveControl();

  async function confirmArchive() {
    if (!archiveTarget) return;
    try {
      await archive.mutateAsync(archiveTarget.id);
      setArchiveTarget(null);
    } catch {
      // surfaced via archive.error
    }
  }

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
            onEdit={(c) => setEditControl(c)}
            onArchive={(c) => setArchiveTarget(c)}
            onLinkObligation={openMapForControl}
            onLinkPolicy={(c) => setPolicyControl(toControlPreset(c))}
            onAttachEvidence={(c) => setAttachEvidenceControl(c)}
          />
        </div>
        <div>
          <ControlTestHealth data={data} />
        </div>
      </motion.div>

      <ControlCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ControlEditModal control={editControl} onClose={() => setEditControl(null)} />
      <Modal
        open={archiveTarget != null}
        onClose={() => setArchiveTarget(null)}
        title="Archive control"
        subtitle="This retires the control from the active register"
        icon={Archive}
        accent="amber"
        widthClassName="max-w-md"
      >
        <div className="space-y-4" data-testid="control-archive-confirm">
          <p className="text-[13px] text-cv-slate">
            Archive <span className="font-semibold text-cv-ink">{archiveTarget?.title}</span>? It will be marked
            archived and removed from the active register. Controls are never hard-deleted — this preserves the audit
            trail and can be reviewed later.
          </p>
          <EntitlementBanner error={archive.error instanceof ApiError ? archive.error : null} />
          <div className="flex items-center justify-end gap-2.5">
            <button type="button" onClick={() => setArchiveTarget(null)} className="cv-ring-focus rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-cv-ink ring-1 ring-white/70 transition hover:bg-white">
              Cancel
            </button>
            <button
              type="button"
              data-testid="control-archive-confirm-btn"
              onClick={confirmArchive}
              disabled={archive.isPending}
              className="cv-ring-focus inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-button transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {archive.isPending ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
              Archive control
            </button>
          </div>
        </div>
      </Modal>
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
      {attachEvidenceControl ? (
        <AttachEvidenceModal
          open
          controlId={attachEvidenceControl.id}
          controlTitle={attachEvidenceControl.title}
          onClose={() => setAttachEvidenceControl(null)}
        />
      ) : null}
    </div>
  );
}
