import React from 'react';
import { X, CheckSquare, Square, SlidersHorizontal, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSearch } from '../contexts/SearchContext';
import SearchInput from './ui/SearchInput';
import type { ArchiveFilter } from '@/lib/types';

interface ReferralFilterBarProps {
  filterOptions: string[];
  activeFilters: string[];
  onToggleFilter: (filter: string) => void;
  onClearFilters: () => void;
  accountFilter: string | null;
  archiveFilter: ArchiveFilter;
  onArchiveFilterChange: (filter: ArchiveFilter) => void;
  onSelectAll: () => void;
  numSelected: number;
  totalCount: number;
  onOpenAdvanced: () => void;
  isAdvancedFilterActive: boolean;
  onExportClick: () => void;
  id?: string;
  stoplightFilter: string | null;
  onStoplightFilterChange?: (status: string | null) => void;
}

const ReferralFilterBar: React.FC<ReferralFilterBarProps> = ({
  filterOptions,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  accountFilter,
  archiveFilter,
  onArchiveFilterChange,
  onSelectAll,
  numSelected,
  totalCount,
  onOpenAdvanced,
  isAdvancedFilterActive,
  onExportClick,
  id,
  stoplightFilter,
  onStoplightFilterChange,
}) => {
  const hasActiveFilters = activeFilters.length > 0 || accountFilter || archiveFilter !== 'active' || isAdvancedFilterActive || stoplightFilter;
  const allSelected = totalCount > 0 && numSelected === totalCount;
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { term, setTerm } = useSearch();

  const stoplightOptions = [
    { status: 'green', color: 'bg-green-500' },
    { status: 'yellow', color: 'bg-yellow-400' },
    { status: 'red', color: 'bg-red-500' },
  ];
  
  const archiveOptions: { label: string; value: ArchiveFilter }[] = [
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
    { label: 'All', value: 'all' },
  ];

  return (
    <header
      id={id}
      className="sticky top-0 bg-surface/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-black/5 dark:border-white/5 z-20"
      role="region"
      aria-label="Referral toolbar"
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 min-h-[48px]">
          {isMobile ? (
            <SearchInput
              value={term}
              onChange={setTerm}
              placeholder="Search referrals..."
              className="w-full"
            />
          ) : null}
          
          <div id="tour-referrals-actions-group" className="flex items-center gap-2">
            <div id="tour-stoplight-filter" className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
              {stoplightOptions.map(({ status, color }) => (
                <button
                  key={status}
                  onClick={() => onStoplightFilterChange?.(stoplightFilter === status ? null : status)}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all",
                    color,
                    stoplightFilter === status ? 'ring-2 ring-offset-1 ring-offset-surface ring-accent' : 'opacity-50 hover:opacity-100'
                  )}
                  aria-label={`Filter by ${status}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
                {archiveOptions.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onArchiveFilterChange(opt.value)}
                        aria-pressed={archiveFilter === opt.value}
                        className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                            archiveFilter === opt.value
                                ? "bg-accent text-white shadow-sm"
                                : "text-muted hover:bg-gray-200 dark:hover:bg-zinc-700"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <Button variant="ghost" size="sm" onClick={onOpenAdvanced} className="text-xs !h-auto relative">
              <SlidersHorizontal className="h-4 w-4 mr-1.5" />
              Advanced
              {isAdvancedFilterActive && <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="text-xs !h-auto"
              disabled={totalCount === 0}
            >
              {allSelected ? <CheckSquare className="h-4 w-4 mr-1.5 text-accent" /> : <Square className="h-4 w-4 mr-1.5" />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onExportClick} className="text-xs !h-auto">
                <Download className="h-4 w-4 mr-1.5" />
                Export
            </Button>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs !h-auto ml-auto">
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
      </div>
    </header>
  );
};

export default ReferralFilterBar;
