import { create } from 'zustand';

export type TourKey = 'dashboard' | 'referrals' | 'marketing' | 'my-accounts' | 'settings';

interface TourState {
  run: boolean;
  stepIndex: number;
  tourKey: TourKey | null;
  startTour: (key: TourKey) => void;
  stopTour: () => void;
  goToStep: (index: number) => void;
  nextStep: () => void;
}

export const useTourState = create<TourState>((set) => ({
  run: false,
  stepIndex: 0,
  tourKey: null,
  startTour: (key) => set({ run: true, stepIndex: 0, tourKey: key }),
  stopTour: () => set({ run: false, stepIndex: 0, tourKey: null }),
  goToStep: (index) => set({ stepIndex: index }),
  nextStep: () => set((state) => ({ stepIndex: state.stepIndex + 1 })),
}));
