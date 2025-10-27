import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { X, Edit, FileCheck } from 'lucide-react';

interface BulkActionsFooterProps {
  selectedCount: number;
  onClear: () => void;
  onUpdateStage: () => void;
  onUpdateDocs: () => void;
}

const BulkActionsFooter: React.FC<BulkActionsFooterProps> = ({ selectedCount, onClear, onUpdateStage, onUpdateDocs }) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 md:left-48 right-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-t border-border-color shadow-lg z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
            <div className="text-sm font-medium text-text">
              <span className="bg-teal-600 text-white rounded-full h-6 w-6 inline-flex items-center justify-center mr-2">{selectedCount}</span>
              selected
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClear}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button size="sm" variant="outline" onClick={onUpdateDocs}>
                <FileCheck className="h-4 w-4 mr-2" />
                Update Docs
              </Button>
              <Button size="sm" onClick={onUpdateStage}>
                <Edit className="h-4 w-4 mr-2" />
                Update Stage
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionsFooter;
