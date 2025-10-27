import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { Loader2, ChevronDown, PlusCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { LabelChip } from './LabelChip';
import type { MarketingLead } from '@/lib/types';

interface LeadSearchableSelectProps {
  label: string;
  value: string; // lead.id
  onChange: (lead: Partial<MarketingLead> | null) => void;
  onManualEntryRequest: (searchTerm: string) => void;
  isRecommended?: boolean;
}

const LeadSearchableSelect: React.FC<LeadSearchableSelectProps> = ({ label, value, onChange, onManualEntryRequest, isRecommended }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  const { data: selectedLead, isLoading: isLoadingSelectedName } = useQuery({
    queryKey: ['lead_details_for_select', value],
    queryFn: async () => {
      if (!value) return null;
      const { data, error } = await supabase.from('marketing_leads').select('id, name').eq('id', value).single();
      if (error) throw error;
      return data;
    },
    enabled: !!value,
    staleTime: Infinity,
  });

  const { data: options = [], isLoading: isLoadingOptions } = useQuery({
    queryKey: ['marketing_leads_search', debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase.from('marketing_leads').select('id, name, street, city, state, zip, phone, full_address').is('deleted_at', null).limit(20).order('name');
      if (debouncedSearchTerm) {
        query = query.ilike('name', `%${debouncedSearchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });
  
  const isLoading = isLoadingSelectedName || isLoadingOptions;

  const handleClearSelection = () => {
    onChange(null);
    setSearchTerm('');
    setIsOpen(true);
  };

  const showAddOption = !isLoadingOptions && debouncedSearchTerm && !options.some(opt => opt.name.toUpperCase() === debouncedSearchTerm.toUpperCase());

  if (value && selectedLead) {
    return (
      <div>
        <LabelChip htmlFor="lead-search-select" className="mb-1.5">
          {label}
          {isRecommended && <span className="text-red-500">*</span>}
        </LabelChip>
        <div className="flex items-center justify-between w-full h-10 px-3 text-sm bg-gray-100 dark:bg-zinc-800 text-text border border-border-color rounded-xl shadow-sm">
          <span className="font-medium">{selectedLead.name}</span>
          <button type="button" onClick={handleClearSelection} className="p-1 text-muted hover:text-text rounded-full">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <LabelChip htmlFor="lead-search-select" className="mb-1.5">
        {label}
        {isRecommended && <span className="text-red-500">*</span>}
      </LabelChip>
      <div className="relative">
        <input
          id="lead-search-select"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="block w-full sm:text-sm border rounded-xl h-10 px-3 bg-neutral-50 dark:bg-zinc-800 text-text border-neutral-300 dark:border-zinc-700 placeholder:text-muted focus:ring-2 focus:ring-pc-focus focus:border-pc-blue-600 focus:outline-none"
          placeholder="Type to search leads..."
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-10 mt-1 w-full bg-surface border border-border-color rounded-xl shadow-lg max-h-60 overflow-auto p-1"
          >
            {options.map(opt => (
              <li
                key={opt.id}
                onClick={() => {
                  onChange(opt);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="px-3 py-2 text-sm text-text rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                {opt.name}
              </li>
            ))}
            {showAddOption && (
              <li
                onClick={() => {
                    onManualEntryRequest(debouncedSearchTerm);
                    setIsOpen(false);
                }}
                className="px-3 py-2 text-sm text-accent rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Create new lead: "{debouncedSearchTerm}"
              </li>
            )}
            {!isLoading && options.length === 0 && !showAddOption && (
              <li className="px-3 py-2 text-sm text-muted">No leads found.</li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadSearchableSelect;
