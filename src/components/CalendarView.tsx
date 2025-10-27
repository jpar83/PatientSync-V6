import React, { useMemo } from 'react';
import type { MarketingInService } from '@/lib/types';
import InServiceCard from './InServiceCard';
import { motion } from 'framer-motion';

interface CalendarViewProps {
  events: MarketingInService[];
  onEdit: (item: MarketingInService) => void;
  onDelete: (item: MarketingInService) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onEdit, onDelete }) => {
  const groupedEvents = useMemo(() => {
    const groups: Record<string, MarketingInService[]> = {};
    events.forEach(event => {
      const date = new Date(event.date_time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    return groups;
  }, [events]);

  return (
    <div className="max-w-3xl mx-auto">
      <ul className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dayEvents], index) => (
          <motion.li
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">{date}</h3>
            <div className="space-y-3">
              {dayEvents.map(event => (
                <InServiceCard key={event.id} event={event} onEdit={() => onEdit(event)} onDelete={() => onDelete(event)} />
              ))}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default CalendarView;
