import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useHelpMenuState } from '@/state/useHelpMenuState';

const HelpButton = () => {
  const openHelpMenu = useHelpMenuState((state) => state.openHelpMenu);

  return (
    <div className="fixed bottom-8 left-8 z-40 hidden md:block">
      <Button
        onClick={openHelpMenu}
        className="rounded-full bg-accent hover:bg-accent/90 text-white shadow-lg w-14 h-14"
        aria-label="Open Help Menu"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default HelpButton;
