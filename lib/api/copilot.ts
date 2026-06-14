import { apiFetch, ApiError } from "@/lib/api/client";

/**
 * Copilot is an UNCONFIRMED backend surface in this codebase. These helpers probe for a real
 * endpoint and only ever relay genuine backend responses. No answer is ever fabricated locally.
 */

const CHAT_ENDPOINTS = [
  "/api/v1/copilot/chat",
  "/api/v1/copilot/messages",
  "/api/v1/copilot",
  "/api/v1/assistant",
  "/api/v1/ai-assistant"
];

export type CopilotProbe = {
  available: boolean;
  /** the endpoint that responded as usable (ok or method/payload error), if any */
  endpoint: string | null;
};

/**
 * Determine whether a Copilot backend exists without fabricating anything.
 * - A 404 on a candidate means "not this path" -> try the next.
 * - ok / 400 / 405 / 422 means the path EXISTS (wrong method/payload is fine) -> available.
 * - 401/403 means auth, but the endpoint exists -> available.
 * - If every candidate 404s (or nothing is reachable), Copilot is unavailable.
 * Never throws.
 */
export async function probeCopilot(): Promise<CopilotProbe> {
  for (const endpoint of CHAT_ENDPOINTS) {
    try {
      await apiFetch<unknown>(endpoint, { method: "GET" });
      return { available: true, endpoint };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) continue; // path missing, keep looking
        // any non-404 status means the path exists in some form
        return { available: true, endpoint };
      }
      // network / unknown error -> cannot confirm a backend; keep trying others
    }
  }
  return { available: false, endpoint: null };
}

export type CopilotSendInput = {
  endpoint: string;
  message: string;
  context?: Record<string, unknown>;
};

/** Send a message to the confirmed Copilot endpoint. Returns the raw backend payload. */
export function sendCopilotMessage({ endpoint, message, context }: CopilotSendInput) {
  return apiFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify({ message, prompt: message, ...(context ? { context } : {}) })
  });
}
