import { cn } from "../../lib/utils";
import React from 'react';

export const IconBtn = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-grid place-items-center size-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 focus-ring lift elevate dark:bg-surface dark:text-muted dark:border-border-color dark:hover:bg-gray-800",
        className
      )}
      {...props}
    />
  );
});
IconBtn.displayName = 'IconBtn';
