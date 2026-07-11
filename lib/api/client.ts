type ValidationItem = { msg?: string; loc?: (string | number)[] };

export type ApiErrorPayload = {
  message?: string;
  detail?: string | ValidationItem[];
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

function getOrgId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("cv_org");
}

let redirectingToLogin = false;

/**
 * An authenticated request came back 401 → the stored token is missing/expired.
 * Clear it and bounce to the login screen. Guarded so concurrent 401s (react-query
 * fires many requests in parallel) only trigger a single navigation.
 */
function handleExpiredSession(): void {
  if (typeof window === "undefined" || redirectingToLogin) {
    return;
  }
  redirectingToLogin = true;
  window.localStorage.removeItem("cv_token");
  window.localStorage.removeItem("cv_org");
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

function toProxyPath(path: string): string {
  return `/api/proxy/${path.replace(/^\/+/, "")}`;
}

function errorMessage(status: number, payload?: ApiErrorPayload): string {
  if (payload?.message) return payload.message;
  // FastAPI 422 returns `detail` as an array of validation items; flatten to a readable string.
  if (Array.isArray(payload?.detail)) {
    const msgs = payload.detail.map((item) => item?.msg).filter(Boolean);
    if (msgs.length) return msgs.join(". ");
  } else if (typeof payload?.detail === "string" && payload.detail) {
    return payload.detail;
  }
  return payload?.error || `Request failed with status ${status}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Several backend endpoints scope by org via this header (session org is the fallback).
  const orgId = getOrgId();
  if (orgId) {
    headers.set("X-Organization-ID", orgId);
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
    // An authenticated request rejected with 401 means the token is expired/invalid.
    // Drop it and redirect to login. We only do this when a token was actually sent so
    // that an invalid-credentials 401 on the login form still surfaces its error message.
    if (response.status === 401 && token) {
      handleExpiredSession();
    }
    const typed = (payload || {}) as ApiErrorPayload;
    throw new ApiError(errorMessage(response.status, typed), response.status, typed);
  }

  return payload as T;
}
