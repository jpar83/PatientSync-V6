import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { AuditLogEntry } from '@/lib/types';
import { displayName } from '@/lib/users/displayName';

interface ActivityFeedProps {
    feed: AuditLogEntry[];
    isLoading: boolean;
}

const ActivityItem: React.FC<{ item: AuditLogEntry }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    let content = item.action.replace(/_/g, ' ');
    if (item.details?.note) content = item.details.note;
    else if (item.details?.to) content = `Moved to ${item.details.to}`;
    else if (item.details?.document) content = `Doc '${item.details.document}' marked ${item.details.status}`;
    
    const needsTruncation = content.length > 60;

    return (
        <li className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50">
            <Link to={`/referrals?openPatientId=${item.details?.patient_id}`} className="block">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-text">{displayName({ full_name: item.changed_user, email: item.changed_by })}</p>
                    <p className="text-xs text-muted flex-shrink-0 ml-2">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className={cn("text-xs text-muted", !isExpanded && needsTruncation && "line-clamp-2")}>
                    {content}
                </p>
            </Link>
            {needsTruncation && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-accent font-semibold mt-1">
                    {isExpanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </li>
    );
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ feed, isLoading }) => {
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }

  return (
    <>
      {(!feed || feed.length === 0) ? (
        <EmptyState title="No Recent Activity" message="Stage changes and notes will appear here." />
      ) : (
        <ul className="space-y-1 max-h-80 overflow-y-auto pr-2">
          {feed.map(item => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </>
  );
};

export default ActivityFeed;
