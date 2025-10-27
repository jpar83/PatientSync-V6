import { create } from 'zustand';
import type { MarketingLead } from '@/lib/types';

interface NestedLeadModalState {
  isOpen: boolean;
  initialName: string;
  onSaveSuccess: ((newLead: MarketingLead) => void) | null;
  openModal: (initialName: string, onSaveSuccess: (newLead: MarketingLead) => void) => void;
  closeModal: () => void;
}

export const useNestedLeadModal = create<NestedLeadModalState>((set) => ({
  isOpen: false,
  initialName: '',
  onSaveSuccess: null,
  openModal: (initialName, onSaveSuccess) => set({ isOpen: true, initialName, onSaveSuccess }),
  closeModal: () => set({ isOpen: false, initialName: '', onSaveSuccess: null }),
}));
