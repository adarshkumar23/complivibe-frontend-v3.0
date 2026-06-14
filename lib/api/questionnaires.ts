import { apiFetch, ApiError } from "@/lib/api/client";

export function getQuestionnaires() {
  return apiFetch<unknown>("/api/v1/questionnaires?limit=100");
}

/**
 * Questionnaire templates are optional. This backend has no `/questionnaires/templates` route — the
 * path resolves against `/questionnaires/{questionnaire_id}` and is rejected as an invalid UUID (422).
 * Treat that (and 404/405/501) as "no templates" so the UI degrades to a graceful empty state.
 */
export async function getQuestionnaireTemplates() {
  try {
    return await apiFetch<unknown>("/api/v1/questionnaires/templates");
  } catch (err) {
    if (err instanceof ApiError && [404, 405, 422, 501].includes(err.status)) return { items: [] };
    throw err;
  }
}

/** Real multipart upload. Throws ApiError on failure — never fakes success. */
export async function uploadQuestionnaire(file: File): Promise<unknown> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("cv_token") : null;
  const form = new FormData();
  form.append("file", file);
  form.append("filename", file.name);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch("/api/proxy/api/v1/questionnaires/upload", { method: "POST", headers, body: form });
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = undefined;
  }
  if (!res.ok) {
    const typed = (payload || {}) as { message?: string; detail?: string };
    throw new ApiError(typed.message || typed.detail || `Upload failed (${res.status})`, res.status, typed);
  }
  return payload;
}

export function answerQuestionnaire(id: string | null) {
  return apiFetch<unknown>("/api/v1/questionnaires/answer", {
    method: "POST",
    body: JSON.stringify(id ? { questionnaire_id: id } : {})
  });
}
