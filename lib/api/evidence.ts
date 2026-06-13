import { apiFetch, ApiError } from "@/lib/api/client";

export function getEvidenceList() {
  return apiFetch<unknown>("/api/v1/evidence?limit=100");
}

/**
 * Real multipart upload to the evidence endpoint (if the backend exposes it).
 * Uses FormData directly (not the JSON apiFetch) so the browser sets the multipart boundary.
 * Never fakes success — throws ApiError on any non-OK response so the UI can show a real state.
 */
export async function uploadEvidence(file: File): Promise<unknown> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("cv_token") : null;
  const form = new FormData();
  form.append("file", file);
  form.append("filename", file.name);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch("/api/proxy/api/v1/evidence/upload", {
    method: "POST",
    headers,
    body: form
  });

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
