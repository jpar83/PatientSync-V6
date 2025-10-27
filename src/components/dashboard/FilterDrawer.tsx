import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/Select';
import MultiSelect from '@/components/ui/MultiSelect';
import { X, SlidersHorizontal } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    dateRange: string;
    payer: string[];
    region: string;
    marketer: string;
  };
  onFilterChange: (filterName: string, value: string | string[]) => void;
  onClear: () => void;
  payers: string[];
  regions: string[];
  marketers: string[];
}

const dateRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen, onClose, filters, onFilterChange, onClear, payers, regions, marketers
}) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const payerOptions = payers.map(p => ({ value: p, label: p }));
  const regionOptions = [{ value: 'all', label: 'All Regions' }, ...regions.map(r => ({ value: r, label: r }))];
  const marketerOptions = [{ value: 'all', label: 'All Marketers' }, ...marketers.map(m => ({ value: m, label: m }))];

  const handleApply = () => {
    onClose();
  };

  const filterContent = (
    <div className="p-6 space-y-6">
      <Select label="Date Range" options={dateRangeOptions} value={filters.dateRange} onChange={e => onFilterChange('dateRange', e.target.value)} />
      <MultiSelect label="Payer" options={payerOptions} selected={filters.payer} onChange={selected => onFilterChange('payer', selected)} />
      <Select label="Region" options={regionOptions} value={filters.region} onChange={e => onFilterChange('region', e.target.value)} />
      <Select label="Marketer" options={marketerOptions} value={filters.marketer} onChange={e => onFilterChange('marketer', e.target.value)} />
    </div>
  );

  const footerContent = (
    <div className="p-4 border-t border-border-color bg-surface flex gap-3">
      <Button variant="outline" onClick={onClear} className="flex-1">
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

export default FilterDrawer;
