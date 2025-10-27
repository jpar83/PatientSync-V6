import { create } from "zustand";
import type { MarketingLead } from "@/lib/types";

interface ConvertLeadModalState {
  isOpen: boolean;
  lead: MarketingLead | null;
  openModal: (lead: MarketingLead) => void;
  closeModal: () => void;
}

export const useConvertLeadModal = create<ConvertLeadModalState>((set) => ({
  isOpen: false,
  lead: null,
  openModal: (lead) => set({ isOpen: true, lead }),
  closeModal: () => set({ isOpen: false, lead: null }),
}));
