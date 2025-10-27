import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const Drawer = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => onOpenChange(false)}
          />
          {children}
        </div>
      )}
    </AnimatePresence>
  );
};

const DrawerContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ y: '100%' }}
    animate={{ y: '0%' }}
    exit={{ y: '100%' }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    className={cn("relative w-full bg-surface", className)}
    {...props}
  >
    {children}
  </motion.div>
));
DrawerContent.displayName = "DrawerContent";

export { Drawer, DrawerContent };
