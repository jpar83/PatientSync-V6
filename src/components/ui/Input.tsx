import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { LabelChip } from '@/components/ui/LabelChip';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wrapperClassName?: string;
  error?: string;
  isRecommended?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, wrapperClassName, className, error, isRecommended, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    return (
      <div className={wrapperClassName}>
        <LabelChip htmlFor={inputId} className="mb-1.5">
          {label}{' '}
          {isRecommended && <span className="text-red-500" title="Recommended for complete record">*</span>}
        </LabelChip>
        <div className="relative rounded-xl shadow-sm">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full sm:text-sm border rounded-xl h-10 px-3',
              'bg-neutral-50 dark:bg-zinc-800 text-text border-neutral-300 dark:border-zinc-700 placeholder:text-muted',
              'focus:ring-2 focus:ring-pc-focus focus:border-pc-blue-600 focus:outline-none',
              {
                'border-red-400 dark:border-red-600 text-red-900 placeholder-red-300 bg-red-50 dark:bg-rose-900/20': hasError,
              },
              className
            )}
            {...props}
          />
          {hasError && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
          )}
        </div>
        {hasError && <p className="mt-1 text-xs text-red-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
