import { apiFetch } from "@/lib/api/client";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token?: string;
  token?: string;
  data?: {
    access_token?: string;
    token?: string;
  };
  [key: string]: unknown;
};

export function login(input: LoginInput) {
  return apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function extractToken(payload: LoginResponse): string | null {
  return payload.access_token || payload.token || payload.data?.access_token || payload.data?.token || null;
}

export type MyOrganization = {
  id: string;
  name: string;
  slug: string;
};

/** GET /api/v1/organizations/me returns the orgs the current user belongs to. */
export function getMyOrganizations() {
  return apiFetch<MyOrganization[]>("/api/v1/organizations/me");
}
