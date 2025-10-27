import React, { Fragment, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useUIState } from '@/state/useUIState';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

const SlideOver: React.FC<SlideOverProps> = ({ isOpen, onClose, title, children, headerContent }) => {
  const setOverlayVisible = useUIState(state => state.setOverlayVisible);

  useEffect(() => {
    setOverlayVisible(isOpen);
    return () => {
      setOverlayVisible(false);
    };
  }, [isOpen, setOverlayVisible]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 overflow-hidden z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-black/50 transition-opacity"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            ></motion.div>

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                className="pointer-events-auto w-screen max-w-2xl"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="flex h-full flex-col bg-surface shadow-xl">
                  <div className="bg-teal-600 dark:bg-teal-700 py-4 px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-white truncate" id="slide-over-title">
                        {title}
                      </h2>
                      <div className="ml-3 flex h-7 items-center gap-3">
                        {headerContent}
                        <button
                          type="button"
                          className="rounded-md bg-teal-600 dark:bg-teal-700 text-teal-200 hover:text-white"
                          onClick={onClose}
                          aria-label="Close panel"
                        >
                          <span className="sr-only">Close panel</span>
                          <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex-1 overflow-y-auto">
                    {children}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SlideOver;
