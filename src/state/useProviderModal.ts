import { create } from "zustand";

interface ProviderModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useProviderModal = create<ProviderModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
