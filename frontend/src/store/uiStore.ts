// frontend/src/store/uiStore.ts
import { create } from 'zustand';

interface UiState {
  activeRequests: number;
  startRequest: () => void;
  endRequest: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeRequests: 0,
  startRequest: () => set((state) => ({ activeRequests: state.activeRequests + 1 })),
  endRequest: () => set((state) => ({ activeRequests: Math.max(0, state.activeRequests - 1) })),
}));
