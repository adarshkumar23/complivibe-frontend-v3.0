import { getStringFromPaths, getArrayFromPaths, normalizeList } from "@/lib/api/normalizers";

/* =========================================================================
 * Copilot response model — only ever reflects genuine backend output.
 * No answer, recommendation, or source is fabricated here.
 * ========================================================================= */

export type CopilotSource = {
  title: string;
  module: string | null;
  href: string | null;
};

export type CopilotAnswer = {
  /** the assistant answer text from the backend, or null if none was returned */
  answer: string | null;
  sources: CopilotSource[];
};

export function normalizeCopilotResponse(value: unknown): CopilotAnswer {
  const answer = getStringFromPaths(value, [
    "answer",
    "response",
    "message",
    "content",
    "text",
    "reply",
    "output",
    "completion",
    "data.answer",
    "data.message",
    "result.answer"
  ]);

  const sources: CopilotSource[] = normalizeList(value, [
    "sources",
    "citations",
    "references",
    "data.sources",
    "context"
  ]).map((entry) => ({
    title: getStringFromPaths(entry, ["title", "name", "label", "source", "document"]) || "Source",
    module: getStringFromPaths(entry, ["module", "type", "category"]),
    href: getStringFromPaths(entry, ["href", "url", "link", "route"])
  }));

  return { answer: answer ?? null, sources };
}

/** Whether a backend payload actually carried an answer (used to avoid showing empty bubbles). */
export function hasCopilotAnswer(value: unknown): boolean {
  return normalizeCopilotResponse(value).answer !== null;
}

/** Some backends return a list of messages; relay them verbatim, never synthesize. */
export function normalizeCopilotMessages(value: unknown): { role: string; content: string }[] {
  const list = getArrayFromPaths(value, ["messages", "history", "data.messages"]);
  return list
    .map((entry) => ({
      role: getStringFromPaths(entry, ["role", "author", "sender", "from"]) || "assistant",
      content:
        getStringFromPaths(entry, ["content", "message", "text", "answer", "response"]) || ""
    }))
    .filter((m) => m.content.length > 0);
}
