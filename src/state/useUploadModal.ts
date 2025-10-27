import { create } from "zustand";

interface UploadState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useUploadModal = create<UploadState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
