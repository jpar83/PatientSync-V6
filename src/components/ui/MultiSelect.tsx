import React, { useState, useRef } from 'react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const displayValue = selected.length > 0
    ? `${selected.length} selected`
    : 'Select...';

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-sm font-medium text-muted mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-10 px-3 text-sm bg-surface text-text border border-border-color rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none"
      >
        <span>{displayValue}</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-10 w-full mt-1 bg-surface border border-border-color rounded-xl shadow-lg"
          >
            <div className="p-2 max-h-60 overflow-y-auto">
              {options.map(option => (
                <label key={option.value} className="flex items-center p-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2 text-text">{option.label}</span>
                </label>
              ))}
            </div>
            {selected.length > 0 && (
              <div className="p-2 border-t border-border-color">
                <button
                  onClick={() => onChange([])}
                  className="w-full text-xs text-center text-red-500 hover:underline"
                >
                  Clear selection
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSelect;
