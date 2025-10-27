import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIState } from '@/state/useUIState';

const Dialog = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) => {
  const setOverlayVisible = useUIState(state => state.setOverlayVisible);

  useEffect(() => {
    setOverlayVisible(open);
    return () => {
      setOverlayVisible(false);
    };
  }, [open, setOverlayVisible]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          {children}
        </div>
      )}
    </AnimatePresence>
  );
};

const DialogContent = ({ className, children, ...props }: { className?: string, children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={`relative bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-lg m-4 ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 sm:p-6 border-b dark:border-zinc-800">
    <h2 className="text-lg font-semibold text-gray-800 dark:text-text">{children}</h2>
  </div>
);

const DialogFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 bg-gray-50 dark:bg-black/20 sm:rounded-b-3xl flex flex-col sm:flex-row sm:justify-end gap-3 ${className}`}>
      {children}
    </div>
);

export { Dialog, DialogContent, DialogHeader, DialogFooter };
