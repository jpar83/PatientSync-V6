import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { Loader2, ChevronDown, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from '@/lib/toast';

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isRecommended?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, value, onChange, isRecommended }) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  useOnClickOutside(ref, () => setIsOpen(false));

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const { data: options = [], isLoading } = useQuery({
    queryKey: ['insurance_providers_search', debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase.from('insurance_providers').select('name').limit(10).order('name');
      if (debouncedSearchTerm) {
        query = query.ilike('name', `%${debouncedSearchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data.map(d => d.name);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const normalizedName = name.trim().toUpperCase();
      const { data, error } = await supabase.from('insurance_providers').insert({ name: normalizedName, source: 'form-add' }).select().single();
      if (error) {
        if (error.code === '23505') { // unique constraint violation
            const { data: existing } = await supabase.from('insurance_providers').select('name').ilike('name', normalizedName).single();
            if (existing) return existing.name; // Return existing name if it was a race condition
            throw new Error('Provider already exists.');
        }
        throw error;
      }
      return data.name;
    },
    onSuccess: (newName) => {
      queryClient.invalidateQueries({ queryKey: ['insurance_providers_search'] });
      queryClient.invalidateQueries({ queryKey: ['insurance_providers'] });
      onChange(newName);
      setInputValue(newName);
      setIsOpen(false);
      toast(`Provider "${newName}" added.`, 'ok');
    },
    onError: (error: any) => {
      toast(`Error adding provider: ${error.message}`, 'err');
    }
  });

  const showAddOption = !isLoading && debouncedSearchTerm && !options.some(opt => opt.toUpperCase() === debouncedSearchTerm.toUpperCase());

  return (
    <div ref={ref} className="relative">
      <label className="pc-label-chip mb-1.5">
        {label}
        {isRecommended && <span className="text-red-500" title="Recommended for complete record">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="block w-full sm:text-sm border rounded-xl h-10 px-3 bg-neutral-50 dark:bg-zinc-800 text-text border-neutral-300 dark:border-zinc-700 placeholder:text-muted focus:ring-2 focus:ring-pc-focus focus:border-pc-blue-600 focus:outline-none"
          placeholder="Type to search or add..."
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
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setInputValue(opt);
                  setIsOpen(false);
                }}
                className="px-3 py-2 text-sm text-text rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                {opt}
              </li>
            ))}
            {showAddOption && (
              <li
                onClick={() => addMutation.mutate(debouncedSearchTerm)}
                className="px-3 py-2 text-sm text-accent rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Add "{debouncedSearchTerm}"
              </li>
            )}
            {!isLoading && options.length === 0 && !showAddOption && (
              <li className="px-3 py-2 text-sm text-muted">No providers found.</li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableSelect;
