import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import MultiSelect from '@/components/ui/MultiSelect';

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

const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters, onFilterChange, payers, regions, marketers, lastUpdated, onRefresh, isRefreshing
}) => {
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];
  const payerOptions = payers.map(p => ({ value: p, label: p }));
  const regionOptions = [{ value: 'all', label: 'All Regions' }, ...regions.map(r => ({ value: r, label: r }))];
  const marketerOptions = [{ value: 'all', label: 'All Marketers' }, ...marketers.map(m => ({ value: m, label: m }))];

  return (
    <div className="soft-card p-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <Select label="Date Range" options={dateRangeOptions} value={filters.dateRange} onChange={e => onFilterChange('dateRange', e.target.value)} />
        <MultiSelect label="Payer" options={payerOptions} selected={filters.payer} onChange={selected => onFilterChange('payer', selected)} />
        <Select label="Region" options={regionOptions} value={filters.region} onChange={e => onFilterChange('region', e.target.value)} />
        <Select label="Marketer" options={marketerOptions} value={filters.marketer} onChange={e => onFilterChange('marketer', e.target.value)} />
        <div className="flex items-center gap-2 h-10">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing} className="w-full">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      {lastUpdated && (
        <p className="text-xs text-muted text-right mt-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default DashboardFilterBar;
