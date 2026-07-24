"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEvidence,
  getEvidenceReadinessSummary,
  getEvidenceReadinessGaps,
  getEvidenceDetail,
  getEvidenceAiAssessment,
  createEvidence,
  uploadEvidenceFile,
  linkEvidenceControl,
  unlinkEvidenceControl,
  reviewEvidence,
  type EvidenceCreateInput,
  type EvidenceReviewStatus,
} from "@/lib/api/evidence";

export function useEvidence() {
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: () => getEvidence() });
  const readiness = useQuery({ queryKey: ["evidence-readiness"], queryFn: getEvidenceReadinessSummary });
  const gaps = useQuery({ queryKey: ["evidence-gaps"], queryFn: () => getEvidenceReadinessGaps(20) });

  return { evidence, readiness, gaps };
}

export type EvidenceData = ReturnType<typeof useEvidence>;

// Detail (metadata + linked controls), enabled only when an id is provided.
export function useEvidenceDetail(evidenceId: string | null) {
  return useQuery({
    queryKey: ["evidence", evidenceId],
    queryFn: () => getEvidenceDetail(evidenceId as string),
    enabled: Boolean(evidenceId),
  });
}

// AI assessment — returns null (not an error) until the async drain produces it.
export function useEvidenceAiAssessment(evidenceId: string | null) {
  return useQuery({
    queryKey: ["evidence-ai-assessment", evidenceId],
    queryFn: () => getEvidenceAiAssessment(evidenceId as string),
    enabled: Boolean(evidenceId),
  });
}

function useInvalidateEvidence() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["evidence"] });
    qc.invalidateQueries({ queryKey: ["evidence-readiness"] });
    qc.invalidateQueries({ queryKey: ["evidence-gaps"] });
  };
}

export function useCreateEvidence() {
  const invalidate = useInvalidateEvidence();
  return useMutation({ mutationFn: (body: EvidenceCreateInput) => createEvidence(body), onSuccess: invalidate });
}

export function useUploadEvidenceFile() {
  const invalidate = useInvalidateEvidence();
  return useMutation({
    mutationFn: ({ evidenceId, file }: { evidenceId: string; file: File }) => uploadEvidenceFile(evidenceId, file),
    onSuccess: invalidate,
  });
}

export function useLinkEvidenceControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ evidenceId, controlId, rationale }: { evidenceId: string; controlId: string; rationale?: string }) =>
      linkEvidenceControl(evidenceId, controlId, rationale),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["evidence"] });
      qc.invalidateQueries({ queryKey: ["evidence", vars.evidenceId] });
      qc.invalidateQueries({ queryKey: ["controls"] });
    },
  });
}

export function useUnlinkEvidenceControl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ evidenceId, controlId }: { evidenceId: string; controlId: string }) =>
      unlinkEvidenceControl(evidenceId, controlId),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["evidence", vars.evidenceId] });
      qc.invalidateQueries({ queryKey: ["evidence"] });
    },
  });
}

export function useReviewEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ evidenceId, reviewStatus, reviewNotes }: { evidenceId: string; reviewStatus: EvidenceReviewStatus; reviewNotes?: string | null }) =>
      reviewEvidence(evidenceId, reviewStatus, reviewNotes),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["evidence", vars.evidenceId] });
      qc.invalidateQueries({ queryKey: ["evidence"] });
      qc.invalidateQueries({ queryKey: ["evidence-readiness"] });
    },
  });
}
