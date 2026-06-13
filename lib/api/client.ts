export type ApiErrorPayload = {
  message?: string;
  detail?: string;
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("cv_token");
}

function toProxyPath(path: string): string {
  return `/api/proxy/${path.replace(/^\/+/, "")}`;
}

function errorMessage(status: number, payload?: ApiErrorPayload): string {
  return payload?.message || payload?.detail || payload?.error || `Request failed with status ${status}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(toProxyPath(path), {
    ...init,
    headers,
    cache: "no-store"
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const typed = (payload || {}) as ApiErrorPayload;
    throw new ApiError(errorMessage(response.status, typed), response.status, typed);
  }

  return payload as T;
}
