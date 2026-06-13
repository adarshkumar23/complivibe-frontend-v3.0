"use client";

import { create } from "zustand";

const TOKEN_KEY = "cv_token";

type AuthState = {
  token: string | null;
  hydrated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  hydrate: () => void;
};

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,
  setToken: (token) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    set({ token, hydrated: true });
  },
  clearToken: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    set({ token: null, hydrated: true });
  },
  hydrate: () => set({ token: readToken(), hydrated: true })
}));
