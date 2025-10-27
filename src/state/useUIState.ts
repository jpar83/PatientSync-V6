import { create } from 'zustand';

interface UIState {
  isBulkActionsVisible: boolean;
  setBulkActionsVisible: (isVisible: boolean) => void;
  isOverlayVisible: boolean;
  setOverlayVisible: (isVisible: boolean) => void;
}

export const useUIState = create<UIState>((set) => ({
  isBulkActionsVisible: false,
  setBulkActionsVisible: (isVisible) => set({ isBulkActionsVisible: isVisible }),
  isOverlayVisible: false,
  setOverlayVisible: (isVisible) => set({ isOverlayVisible: isVisible }),
}));
