import React from 'react';
import { X } from 'lucide-react';

export interface Filters {
  stage: string | null;
  complete: string | null;
  insurance: string | null;
  archived: boolean;
}

interface FilterBarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  resultCount: number;
  totalCount: number;
}


const FilterChip: React.FC<{ label: string; active: boolean; onClick: () => void; disabled?: boolean }> = ({ label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active
        ? "bg-teal-600 text-white shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
    }`}
  >
    {label}
  </button>
);

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, resultCount, totalCount }) => {
  const toggleFilter = (key: keyof Omit<Filters, 'archived'>, value: string) => {
    setFilters((prev) =>
      prev[key] === value ? { ...prev, [key]: null } : { ...prev, [key]: value }
    );
  };

  const toggleArchived = () => {
    setFilters(prev => ({ ...prev, archived: !prev.archived }));
  };

  const clearFilters = () => {
    setFilters({ stage: null, complete: null, insurance: null, archived: false });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null && v !== false);
  const isArchivedView = filters.archived;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-600">Quick Filters:</span>
            <FilterChip 
                label="Pending Intake" 
                active={filters.stage === "Patient Intake & Demographics"} 
                onClick={() => toggleFilter("stage", "Patient Intake & Demographics")}
                disabled={isArchivedView}
            />
            <FilterChip 
                label="Ready for PAR" 
                active={filters.complete === "ready"} 
                onClick={() => toggleFilter("complete", "ready")}
                disabled={isArchivedView}
            />
            <FilterChip 
                label="Incomplete Docs" 
                active={filters.complete === "incomplete"} 
                onClick={() => toggleFilter("complete", "incomplete")}
                disabled={isArchivedView}
            />
            <FilterChip 
                label="UHC" 
                active={filters.insurance === "United"} 
                onClick={() => toggleFilter("insurance", "United")}
                disabled={isArchivedView}
            />
            <div className="border-l pl-3 ml-3">
                 <FilterChip 
                    label="Show Archived" 
                    active={filters.archived} 
                    onClick={toggleArchived} 
                />
            </div>
        </div>
        {hasActiveFilters && (
            <div className="flex items-center justify-between border-t pt-3">
                <p className="text-sm text-gray-600">
                    Showing <span className="font-bold text-teal-600">{resultCount}</span> {isArchivedView ? 'archived' : ''} referrals.
                </p>
                <button 
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                    <X className="h-4 w-4" />
                    Clear All Filters
                </button>
            </div>
        )}
    </div>
  );
};

export default FilterBar;
