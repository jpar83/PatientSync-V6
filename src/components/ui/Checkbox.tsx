import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  wrapperClassName?: string;
  isRecommended?: boolean;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, description, wrapperClassName, className, isRecommended, indeterminate, ...props }, ref) => {
    const localRef = useRef<HTMLInputElement>(null);
    const resolvedRef = ref || localRef;

    useEffect(() => {
      if (typeof resolvedRef === 'object' && resolvedRef.current) {
        resolvedRef.current.indeterminate = !!indeterminate;
      }
    }, [resolvedRef, indeterminate]);

    const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={cn('flex items-start', wrapperClassName)}>
        <input
          id={checkboxId}
          ref={resolvedRef}
          type="checkbox"
          className={cn(
            'h-4 w-4 mt-0.5 text-teal-600 border-gray-300 rounded focus:ring-teal-500',
            className
          )}
          {...props}
        />
        {label && (
            <div className="ml-2">
              <label htmlFor={checkboxId} className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                  {label}{' '}
                  {isRecommended && <span className="text-red-500" title="Recommended for complete record">*</span>}
              </label>
              {description && <p className="text-xs text-muted">{description}</p>}
            </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
