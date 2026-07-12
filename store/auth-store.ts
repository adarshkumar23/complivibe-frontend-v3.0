"use client";

import { create } from "zustand";

const CSRF_COOKIE_NAME = "cv_csrf";

type AuthState = {
  /** True if we believe there's an active session (the httpOnly session cookie itself is
   * never readable from JS — this reflects the presence of the non-httpOnly CSRF cookie
   * the backend issues alongside it, which is a reliable proxy since both are set/cleared
   * together on login/logout). An expired-but-still-present cookie is still caught by the
   * normal 401 handling in apiFetch. */
  authenticated: boolean;
  hydrated: boolean;
  setAuthenticated: () => void;
  clearAuthenticated: () => void;
  hydrate: () => void;
};

function hasCsrfCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${CSRF_COOKIE_NAME}=`));
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: false,
  hydrated: false,
  setAuthenticated: () => set({ authenticated: true, hydrated: true }),
  clearAuthenticated: () => set({ authenticated: false, hydrated: true }),
  hydrate: () => set({ authenticated: hasCsrfCookie(), hydrated: true })
}));
