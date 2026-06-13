"use client";

import { create } from "zustand";

export type CommandMode = "compliance" | "ai-governance" | "data-observability";

type UiState = {
  mode: CommandMode;
  sidebarOpen: boolean;
  setMode: (mode: CommandMode) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  mode: "compliance",
  sidebarOpen: false,
  setMode: (mode) => set({ mode }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}));
