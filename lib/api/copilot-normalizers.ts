/**
 * Normalizes a copilot chat response from an unconfirmed backend surface.
 * Only relays what the backend actually returned — never fabricates an answer.
 */

export type CopilotSource = {
  label: string;
  href?: string | null;
};

export function normalizeCopilotResponse(payload: unknown): { answer: string | null; sources: CopilotSource[] } {
  if (payload == null || typeof payload !== "object") return { answer: null, sources: [] };
  const obj = payload as Record<string, unknown>;

  const answerCandidate = obj["answer"] ?? obj["message"] ?? obj["content"] ?? obj["response"] ?? obj["text"];
  const answer = typeof answerCandidate === "string" && answerCandidate.trim() ? answerCandidate : null;

  const rawSources = obj["sources"];
  const sources: CopilotSource[] = Array.isArray(rawSources)
    ? rawSources
        .map((s) => {
          if (typeof s === "string") return { label: s };
          if (s && typeof s === "object") {
            const o = s as Record<string, unknown>;
            const label = o["label"] ?? o["title"] ?? o["name"];
            if (typeof label === "string") {
              return { label, href: typeof o["href"] === "string" ? (o["href"] as string) : null };
            }
          }
          return null;
        })
        .filter((s): s is CopilotSource => s != null)
    : [];

  return { answer, sources };
}
