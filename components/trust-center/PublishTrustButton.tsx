"use client";

import { useState } from "react";
import { Globe, Loader2, Check, TriangleAlert } from "lucide-react";
import { publishTrustCenter } from "@/lib/api/trust-center";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

type State = "idle" | "publishing" | "success" | "error" | "unavailable";

export function PublishTrustButton({ onPublished }: { onPublished?: () => void }) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handlePublish() {
    setState("publishing");
    setMessage(null);
    try {
      await publishTrustCenter();
      setState("success");
      setMessage("Trust Center published.");
      onPublished?.();
    } catch (err) {
      if (err instanceof ApiError && [404, 405, 501].includes(err.status)) {
        setState("unavailable");
        setMessage("Trust Center publishing is not available on this backend yet.");
      } else {
        setState("error");
        setMessage(err instanceof ApiError ? err.message : "Publish failed. Please try again.");
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <button
        type="button"
        onClick={handlePublish}
        disabled={state === "publishing"}
        className="cv-ring-focus group inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2.5 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70"
      >
        {state === "publishing" ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} className="transition group-hover:rotate-12" />}
        {state === "publishing" ? "Publishing…" : "Publish Trust Center"}
      </button>
      {state !== "idle" && state !== "publishing" && message ? (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] font-medium",
            state === "success" ? "text-emerald-600" : state === "unavailable" ? "text-amber-600" : "text-rose-600"
          )}
        >
          {state === "success" ? <Check size={12} /> : <TriangleAlert size={12} />}
          {message}
        </span>
      ) : null}
    </div>
  );
}
