"use client";

import { useState } from "react";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonRows } from "@/components/ui/LoadingSkeleton";
import { normalizeModelCard } from "@/lib/api/ai-system-detail-normalizers";
import { generateModelCard } from "@/lib/api/ai-system-detail";
import type { AiSystemDetail } from "@/lib/hooks/useAiSystemDetail";

export function ModelCardPanel({ data, systemId }: { data: AiSystemDetail; systemId: string }) {
  const { modelCard } = data;
  const card = normalizeModelCard(modelCard.data);
  const [generating, setGenerating] = useState(false);
  const [genState, setGenState] = useState<"idle" | "done" | "error">("idle");

  async function handleGenerate() {
    setGenerating(true);
    setGenState("idle");
    try {
      await generateModelCard(systemId);
      setGenState("done");
      modelCard.refetch();
    } catch {
      setGenState("error");
    } finally {
      setGenerating(false);
    }
  }

  const generateBtn = (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={generating}
      className="cv-ring-focus inline-flex items-center gap-1.5 rounded-full bg-cv-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-60"
    >
      {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
      {generating ? "Generating…" : "Generate Model Card"}
    </button>
  );

  return (
    <SectionCard
      title="Model Card"
      subtitle="Documented model facts"
      icon={FileText}
      accent="purple"
      className="h-full"
      action={card.hasAny ? generateBtn : null}
    >
      {modelCard.isLoading ? (
        <SkeletonRows rows={4} />
      ) : modelCard.isError ? (
        <ErrorState title="Unable to load model card" onRetry={() => modelCard.refetch()} />
      ) : !card.hasAny ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <EmptyState
            compact
            icon={FileText}
            title="No model card yet"
            description={
              genState === "done"
                ? "Generation requested — the model card will appear once ready."
                : "Generate a model card to document intended use, training data, and limitations."
            }
          />
          {generateBtn}
          {genState === "error" ? <p className="text-[11px] text-rose-500">Generation failed. Please try again.</p> : null}
        </div>
      ) : (
        <dl className="space-y-3.5">
          {card.fields.map((f) => (
            <div key={f.label}>
              <dt className="text-[12px] font-bold uppercase tracking-wide text-cv-mist">{f.label}</dt>
              <dd className="mt-0.5 text-[13px] leading-relaxed text-cv-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </SectionCard>
  );
}
