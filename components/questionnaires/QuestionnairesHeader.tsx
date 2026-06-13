"use client";

import { ClipboardList } from "lucide-react";
import { UploadQuestionnaireButton } from "@/components/questionnaires/UploadQuestionnaireButton";

export function QuestionnairesHeader({ onUploaded }: { onUploaded?: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
            <ClipboardList size={15} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cv-blue">Procurement Automation</span>
        </div>
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-cv-ink sm:text-[34px]">Questionnaires</h1>
        <p className="max-w-2xl text-[15px] text-cv-slate">
          Upload, answer, track, and export customer security, compliance, AI governance, and procurement questionnaires.
        </p>
      </div>
      <UploadQuestionnaireButton onUploaded={onUploaded} />
    </div>
  );
}
