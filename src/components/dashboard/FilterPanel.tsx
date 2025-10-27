import React from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/Select';
import MultiSelect from '@/components/ui/MultiSelect';
import { X } from 'lucide-react';

interface FilterPanelProps {
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

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen, onClose, filters, onFilterChange, onClear, payers, regions, marketers
}) => {
  const payerOptions = payers.map(p => ({ value: p, label: p }));
  const regionOptions = [{ value: 'all', label: 'All Regions' }, ...regions.map(r => ({ value: r, label: r }))];
  const marketerOptions = [{ value: 'all', label: 'All Marketers' }, ...marketers.map(m => ({ value: m, label: m }))];

  const handleApply = () => {
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="p-0 rounded-t-2xl h-[85vh] max-h-[85vh] overflow-hidden shadow-xl bg-surface relative">
        <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg p-4 border-b border-border-color flex justify-between items-center">
          <h2 className="font-semibold text-lg">Filters</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="overflow-y-auto p-4 space-y-6 h-[calc(100%-140px)]">
          <Select label="Date Range" options={dateRangeOptions} value={filters.dateRange} onChange={e => onFilterChange('dateRange', e.target.value)} />
          <MultiSelect label="Payer" options={payerOptions} selected={filters.payer} onChange={selected => onFilterChange('payer', selected)} />
          <Select label="Region" options={regionOptions} value={filters.region} onChange={e => onFilterChange('region', e.target.value)} />
          <Select label="Marketer" options={marketerOptions} value={filters.marketer} onChange={e => onFilterChange('marketer', e.target.value)} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-color bg-surface flex gap-3">
          <Button variant="outline" onClick={onClear} className="flex-1">
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default FilterPanel;
