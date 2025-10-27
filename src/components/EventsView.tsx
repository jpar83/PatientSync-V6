import React, { useMemo } from 'react';
import type { MarketingInService } from '@/lib/types';
import EventCard from './EventCard';
import { motion } from 'framer-motion';

interface EventsViewProps {
  events: MarketingInService[];
  onEdit: (item: MarketingInService) => void;
  onDelete: (item: MarketingInService) => void;
}

const EventsView: React.FC<EventsViewProps> = ({ events, onEdit, onDelete }) => {
  const groupedEvents = useMemo(() => {
    const groups: Record<string, MarketingInService[]> = {};
    events.forEach(event => {
      const date = new Date(event.start_at || event.created_at).toLocaleDateString('en-US', {
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
    return Object.entries(groups).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());
  }, [events]);

  return (
    <div className="max-w-3xl mx-auto">
      <ul className="space-y-6">
        {groupedEvents.map(([date, dayEvents], index) => (
          <motion.li
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">{date}</h3>
            <div className="space-y-3">
              {dayEvents.map(event => (
                <EventCard key={event.id} event={event} onEdit={() => onEdit(event)} onDelete={() => onDelete(event)} />
              ))}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default EventsView;
