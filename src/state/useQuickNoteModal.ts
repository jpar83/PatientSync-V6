import { create } from 'zustand';

interface QuickNoteModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useQuickNoteModal = create<QuickNoteModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
