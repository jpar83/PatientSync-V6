import { create } from 'zustand';

interface HelpMenuState {
  isHelpMenuOpen: boolean;
  openHelpMenu: () => void;
  closeHelpMenu: () => void;
}

export const useHelpMenuState = create<HelpMenuState>((set) => ({
  isHelpMenuOpen: false,
  openHelpMenu: () => set({ isHelpMenuOpen: true }),
  closeHelpMenu: () => set({ isHelpMenuOpen: false }),
}));
