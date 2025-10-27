import React from 'react';
import { cn } from '@/lib/utils';

interface LabelChipProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

const LabelChip = React.forwardRef<HTMLLabelElement, LabelChipProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'inline-block rounded-md px-2.5 py-0.5 text-[13px] font-medium tracking-wide bg-[var(--pc-blue-50)] text-[#0A3F6E] dark:text-[#A8CBE8]',
          className
        )}
        {...props}
      >
        {children}
      </label>
    );
  }
);

LabelChip.displayName = 'LabelChip';

export { LabelChip };
