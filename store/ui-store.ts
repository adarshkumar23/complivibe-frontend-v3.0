"use client";

import { create } from "zustand";

export type CommandMode = "compliance" | "ai-governance" | "data-observability";

type UiState = {
  mode: CommandMode;
  sidebarOpen: boolean;
  copilotOpen: boolean;
  setMode: (mode: CommandMode) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  mode: "compliance",
  sidebarOpen: false,
  copilotOpen: false,
  setMode: (mode) => set({ mode }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCopilotOpen: (copilotOpen) => set({ copilotOpen }),
  toggleCopilot: () => set((state) => ({ copilotOpen: !state.copilotOpen }))
}));
