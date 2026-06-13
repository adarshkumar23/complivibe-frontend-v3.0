"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check, TriangleAlert } from "lucide-react";
import { uploadQuestionnaire } from "@/lib/api/questionnaires";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

type State = "idle" | "uploading" | "success" | "error" | "unavailable";

export function UploadQuestionnaireButton({ onUploaded }: { onUploaded?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setState("uploading");
    setMessage(file.name);
    try {
      await uploadQuestionnaire(file);
      setState("success");
      setMessage(`Uploaded ${file.name}`);
      onUploaded?.();
    } catch (err) {
      if (err instanceof ApiError && [404, 405, 501].includes(err.status)) {
        setState("unavailable");
        setMessage("Questionnaire upload is not available on this backend yet.");
      } else {
        setState("error");
        setMessage(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
      }
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const busy = state === "uploading";

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="cv-ring-focus group inline-flex items-center gap-2 rounded-full bg-cv-brand px-5 py-2.5 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 disabled:opacity-70"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} className="transition group-hover:-translate-y-0.5" />}
        {busy ? "Uploading…" : "Upload Questionnaire"}
      </button>
      {state !== "idle" && state !== "uploading" && message ? (
        <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium", state === "success" ? "text-emerald-600" : state === "unavailable" ? "text-amber-600" : "text-rose-600")}>
          {state === "success" ? <Check size={12} /> : <TriangleAlert size={12} />}
          {message}
        </span>
      ) : null}
    </div>
  );
}
