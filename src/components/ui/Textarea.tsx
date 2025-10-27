import React from 'react';
import { cn } from '@/lib/utils';
import { LabelChip } from '@/components/ui/LabelChip';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, wrapperClassName, className, ...props }, ref) => {
    const textareaId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={wrapperClassName}>
        <LabelChip htmlFor={textareaId} className="mb-1.5">
          {label}
        </LabelChip>
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'mt-1 block w-full shadow-sm sm:text-sm rounded-md',
            'bg-neutral-50 dark:bg-zinc-800 text-text border-neutral-300 dark:border-zinc-700 placeholder:text-muted',
            'focus:ring-2 focus:ring-pc-focus focus:border-pc-blue-600 focus:outline-none',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
