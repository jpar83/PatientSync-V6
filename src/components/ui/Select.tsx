import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { LabelChip } from '@/components/ui/LabelChip';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string; disabled?: boolean }[];
  wrapperClassName?: string;
  error?: string;
  isRecommended?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, options, wrapperClassName, className, error, isRecommended, ...props }, ref) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    return (
      <div className={wrapperClassName}>
        <LabelChip htmlFor={selectId} className="mb-1.5">
          {label}{' '}
          {isRecommended && <span className="text-red-500" title="Recommended for complete record">*</span>}
        </LabelChip>
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-xl shadow-sm h-10',
              'bg-neutral-50 dark:bg-zinc-800 text-text border-neutral-300 dark:border-zinc-700',
              'focus:ring-2 focus:ring-pc-focus focus:border-pc-blue-600 focus:outline-none',
              {
                'border-red-400 dark:border-red-600 text-red-900 focus:ring-red-500 focus:border-red-500 bg-red-50 dark:bg-rose-900/20': hasError,
              },
              className
            )}
            {...props}
          >
            <option value="">Select...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          {hasError && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-10">
              <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
          )}
        </div>
        {hasError && <p className="mt-1 text-xs text-red-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
