import React from 'react';
import { Dialog, DialogContent, DialogHeader } from './ui/Dialog';
import { useHelpMenuState } from '@/state/useHelpMenuState';
import { useTourState, TourKey } from '@/state/useTourState';
import { BookOpen, LayoutDashboard, Files, Megaphone, Briefcase, Settings, AlertTriangle } from 'lucide-react';

const tourOptions: { key: TourKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard Tour', icon: LayoutDashboard },
  { key: 'referrals', label: 'Referrals Explained', icon: Files },
  { key: 'stoplight', label: 'Stoplight System', icon: AlertTriangle },
  { key: 'marketing', label: 'Marketing & Leads', icon: Megaphone },
  { key: 'my-accounts', label: 'Payers Overview', icon: Briefcase },
  { key: 'settings', label: 'Settings Tour', icon: Settings },
];

const HelpMenuModal = () => {
  const { isHelpMenuOpen, closeHelpMenu } = useHelpMenuState();
  const startTour = useTourState((state) => state.startTour);

  const handleTourStart = (key: TourKey) => {
    closeHelpMenu();
    // Delay to allow modal to close before tour starts
    setTimeout(() => startTour(key), 300);
  };

  return (
    <Dialog open={isHelpMenuOpen} onOpenChange={closeHelpMenu}>
      <DialogContent className="max-w-md">
        <DialogHeader>Help & Guided Tours</DialogHeader>
        <div className="p-6 space-y-2">
          {tourOptions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTourStart(key)}
              className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors focus-ring"
            >
              <Icon className="h-5 w-5 text-accent" />
              <span className="font-medium text-text">{label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpMenuModal;
