import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/Select';
import MultiSelect from '@/components/ui/MultiSelect';
import { X, SlidersHorizontal } from 'lucide-react';
import type { LeadStatus, MarketingEventType, InServiceStatus } from '@/lib/types';
import { marketingEventTypeOptions } from '@/lib/formConstants';

interface MarketingFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: 'leads' | 'events';
  
  leadFilters: { status: LeadStatus[], type: string[] };
  onLeadFilterChange: (filterName: string, value: string[]) => void;
  onClearLeadFilters: () => void;
  leadTypeOptions: { value: string, label: string }[];
  leadStatusOptions: { value: string, label: string }[];

  eventFilters: { type: MarketingEventType[], status: InServiceStatus[] };
  onEventFilterChange: (filterName: string, value: string[]) => void;
  onClearEventFilters: () => void;
  eventStatusOptions: { value: string, label: string }[];
}

const MarketingFilterDrawer: React.FC<MarketingFilterDrawerProps> = ({
  isOpen, onClose, activeView,
  leadFilters, onLeadFilterChange, onClearLeadFilters, leadTypeOptions, leadStatusOptions,
  eventFilters, onEventFilterChange, onClearEventFilters, eventStatusOptions
}) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const handleApply = () => onClose();

  const filterContent = (
    <div className="p-6 space-y-6">
      {activeView === 'leads' && (
        <>
          <MultiSelect label="Status" options={leadStatusOptions} selected={leadFilters.status} onChange={(s) => onLeadFilterChange('status', s as LeadStatus[])} />
          <MultiSelect label="Type" options={leadTypeOptions} selected={leadFilters.type} onChange={(s) => onLeadFilterChange('type', s)} />
        </>
      )}
      {activeView === 'events' && (
        <>
          <MultiSelect label="Event Type" options={marketingEventTypeOptions} selected={eventFilters.type} onChange={(s) => onEventFilterChange('type', s as MarketingEventType[])} />
          <MultiSelect label="Status" options={eventStatusOptions} selected={eventFilters.status} onChange={(s) => onEventFilterChange('status', s as InServiceStatus[])} />
        </>
      )}
    </div>
  );

  const footerContent = (
    <div className="p-4 border-t border-border-color bg-surface flex gap-3">
      <Button variant="outline" onClick={activeView === 'leads' ? onClearLeadFilters : onClearEventFilters} className="flex-1">
        Reset
      </Button>
      <Button onClick={handleApply} className="flex-1">
        Apply Filters
      </Button>
    </div>
  );

  const desktopDrawer = (
    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
      <motion.div
        className="pointer-events-auto w-screen max-w-sm"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex h-full flex-col bg-surface shadow-2xl ring-1 ring-black/5">
          <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg p-4 border-b border-border-color flex justify-between items-center">
            <h2 className="font-semibold text-lg flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" /> Filters</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filterContent}
          </div>
          {footerContent}
        </div>
      </motion.div>
    </div>
  );

  const mobileDrawer = (
    <motion.div
      className="fixed inset-x-0 bottom-0 max-h-full"
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="p-0 bg-surface shadow-2xl ring-1 ring-black/5 overflow-hidden h-[85vh] rounded-t-3xl flex flex-col">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg p-4 pt-6 border-b border-border-color flex justify-between items-center">
          <h2 className="font-semibold text-lg">Filters</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filterContent}
        </div>
        <div className="sticky bottom-0">
          {footerContent}
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 overflow-hidden z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            ></motion.div>
            {isMobile ? mobileDrawer : desktopDrawer}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MarketingFilterDrawer;
