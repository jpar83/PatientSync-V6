import React from 'react';
import { Select } from './ui/Select';
import MultiSelect from './ui/MultiSelect';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface DashboardFilterBarProps {
  filters: {
    dateRange: string;
    payer: string[];
    region: string;
    marketer: string;
  };
  onFilterChange: (filterName: string, value: string | string[]) => void;
  payers: string[];
  regions: string[];
  marketers: string[];
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const dateRangeOptions = [
  { label: 'All Time', value: 'all' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

const FilterButton: React.FC<{ label: string; value: string; activeValue: string; onClick: (value: string) => void }> = ({ label, value, activeValue, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={cn(
      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1',
      activeValue === value
        ? 'bg-teal-600 text-white shadow-sm'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700'
    )}
  >
    {label}
  </button>
);

const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters,
  onFilterChange,
  payers,
  regions,
  marketers,
  lastUpdated,
  onRefresh,
  isRefreshing,
}) => {
  const toOptions = (items: string[]) => items.map(item => ({ label: item, value: item }));
  const toSingleSelectOptions = (items: string[]) => [{ label: 'All', value: 'all' }, ...items.map(item => ({ label: item, value: item }))];

  return (
    <div className="soft-card p-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-end">
        <div className="space-y-1.5 xl:col-span-2">
          <label className="block text-xs font-medium text-muted px-1">Date Range</label>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            {dateRangeOptions.map(opt => (
              <FilterButton key={opt.value} label={opt.label} value={opt.value} activeValue={filters.dateRange} onClick={(value) => onFilterChange('dateRange', value)} />
            ))}
          </div>
        </div>

        <MultiSelect
          label="Payer"
          options={toOptions(payers)}
          selected={filters.payer}
          onChange={(selected) => onFilterChange('payer', selected)}
          wrapperClassName="min-w-[150px]"
        />

        <Select label="Region" options={toSingleSelectOptions(regions)} value={filters.region} onChange={e => onFilterChange('region', e.target.value)} wrapperClassName="min-w-[150px]" />

        <div className="grid grid-cols-2 gap-3 items-end">
            <Select label="Marketer" options={toSingleSelectOptions(marketers)} value={filters.marketer} onChange={e => onFilterChange('marketer', e.target.value)} wrapperClassName="min-w-[150px]" />
            <div className="flex items-center justify-end">
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onRefresh} disabled={isRefreshing} title="Refresh Data">
                    <RefreshCw className={cn("h-5 w-5 text-muted", isRefreshing && "animate-spin")} />
                </Button>
            </div>
        </div>
      </div>
       <div className="flex items-center justify-end text-xs text-muted pt-2 pr-2">
            <span>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}</span>
        </div>
    </div>
  );
};

export default DashboardFilterBar;
