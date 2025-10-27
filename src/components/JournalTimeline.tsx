import React from 'react';
import type { MarketingTouchpoint } from '@/lib/types';
import JournalCard from './JournalCard';
import { motion } from 'framer-motion';

interface JournalTimelineProps {
  touchpoints: MarketingTouchpoint[];
  onEdit: (item: MarketingTouchpoint) => void;
  onDelete: (item: MarketingTouchpoint) => void;
}

const JournalTimeline: React.FC<JournalTimelineProps> = ({ touchpoints, onEdit, onDelete }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <ul className="space-y-4">
        {touchpoints.map((touchpoint, index) => (
          <motion.li
            key={touchpoint.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <JournalCard touchpoint={touchpoint} onEdit={() => onEdit(touchpoint)} onDelete={() => onDelete(touchpoint)} />
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default JournalTimeline;
