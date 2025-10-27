import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Archive, User } from 'lucide-react';
import type { Order } from '../lib/types';

interface ReferralActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onViewDetails: (order: Order) => void;
  onStageChange: (order: Order) => void;
  onArchive: (order: Order) => void;
}

const ReferralActionsSheet: React.FC<ReferralActionsSheetProps> = ({ isOpen, onClose, order, onViewDetails, onStageChange, onArchive }) => {
  if (!order) return null;

  const actions = [
    { label: 'View/Edit Details', icon: User, handler: () => onViewDetails(order) },
    { label: 'Change Stage', icon: Edit, handler: () => onStageChange(order) },
    { label: 'Archive', icon: Archive, handler: () => onArchive(order) },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full bg-gray-50 dark:bg-zinc-900 rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{order.patients?.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.patients?.primary_insurance}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {actions.map(({ label, icon: Icon, handler }) => (
                <button
                  key={label}
                  onClick={() => { handler(); onClose(); }}
                  className="w-full flex items-center gap-3 p-3 text-left bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                >
                  <Icon className="h-5 w-5 text-teal-600" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReferralActionsSheet;
