type ValidationItem = { msg?: string; loc?: (string | number)[] };

// Structured `detail` object the backend returns for entitlement errors
// (feature_not_in_plan / record_cap_reached) and other HTTPException(detail={...})
// cases. Distinct from a plain-string RBAC detail ("Missing required permission: ...").
export type StructuredDetail = {
  error?: string;
  message?: string;
  upgrade_url?: string;
  // record_cap_reached extras
  resource?: string;
  cap?: number;
  current_count?: number;
  // feature_not_in_plan extras
  feature?: string;
  current_plan?: string;
};

export type ApiErrorPayload = {
  message?: string;
  detail?: string | ValidationItem[] | StructuredDetail;
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

// The session token itself lives in an httpOnly cookie (set by the backend on
// login/register) — it is never readable from JS, so there is nothing here to read
// for the Authorization header. The browser attaches it automatically on same-origin
// requests to /api/proxy/*.
const CSRF_COOKIE_NAME = "cv_csrf";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getCsrfToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getOrgId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("cv_org");
}

let redirectingToLogin = false;

/**
 * An authenticated request came back 401 → the session cookie is missing/expired/revoked.
 * Ask the backend to clear it, drop client-side org state, and bounce to the login screen.
 * Guarded so concurrent 401s (react-query fires many requests in parallel) only trigger a
 * single navigation.
 */
function handleExpiredSession(): void {
  if (typeof window === "undefined" || redirectingToLogin) {
    return;
  }
  redirectingToLogin = true;
  window.localStorage.removeItem("cv_org");
  void fetch(toProxyPath("/api/v1/auth/logout"), { method: "POST", cache: "no-store" }).catch(() => {});
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

function toProxyPath(path: string): string {
  return `/api/proxy/${path.replace(/^\/+/, "")}`;
}

function errorMessage(status: number, payload?: ApiErrorPayload): string {
  if (payload?.message) return payload.message;
  const detail = payload?.detail;
  // FastAPI 422 returns `detail` as an array of validation items; flatten to a readable string.
  if (Array.isArray(detail)) {
    const msgs = detail.map((item) => item?.msg).filter(Boolean);
    if (msgs.length) return msgs.join(". ");
  } else if (typeof detail === "string" && detail) {
    return detail;
  } else if (detail && typeof detail === "object" && typeof detail.message === "string" && detail.message) {
    // Structured HTTPException detail, e.g. entitlement errors:
    // {"detail":{"error":"feature_not_in_plan","message":"...","upgrade_url":"..."}}
    return detail.message;
  }
  return payload?.error || `Request failed with status ${status}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  // Several backend endpoints scope by org via this header (session org is the fallback).
  const orgId = getOrgId();
  if (orgId) {
    headers.set("X-Organization-ID", orgId);
  }

  const method = (init?.method || "GET").toUpperCase();
  const csrfToken = getCsrfToken();
  if (MUTATING_METHODS.has(method) && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
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
    // A 401 on a request we believed was authenticated (we had a CSRF cookie, meaning a
    // session cookie was issued at some point) means the session expired/was revoked.
    // Drop client state and redirect. We only do this when we thought we had a session so
    // that an invalid-credentials 401 on the login form still surfaces its error message.
    if (response.status === 401 && csrfToken) {
      handleExpiredSession();
    }
    const typed = (payload || {}) as ApiErrorPayload;
    throw new ApiError(errorMessage(response.status, typed), response.status, typed);
  }

  return payload as T;
}

/**
 * Multipart POST for real file uploads (e.g. evidence file upload). Unlike
 * apiFetch, this must NOT set Content-Type — the browser sets it to
 * multipart/form-data with the correct boundary from the FormData body. Org +
 * CSRF headers are still sent, and errors are surfaced as ApiError just like
 * apiFetch (so a 413/415/503 from the backend carries its detail message).
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers();
  const orgId = getOrgId();
  if (orgId) {
    headers.set("X-Organization-ID", orgId);
  }
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(toProxyPath(path), {
    method: "POST",
    headers,
    body: formData,
    cache: "no-store"
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    if (response.status === 401 && csrfToken) {
      handleExpiredSession();
    }
    const typed = (payload || {}) as ApiErrorPayload;
    throw new ApiError(errorMessage(response.status, typed), response.status, typed);
  }

  return payload as T;
}
