import React, { useMemo, useRef } from 'react';
import type { Order } from '../lib/types';
import ListSkeleton from './ui/ListSkeleton';
import EmptyState from './ui/EmptyState';
import { CompactReferralRow } from './CompactReferralRow';
import { daysOld } from '../lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ReferralsListMobileProps {
  orders: Order[];
  isLoading: boolean;
  onViewDetails: (order: Order) => void;
}

const formatRelativeTime = (dateString: string | null | undefined): string | undefined => {
    if (!dateString) return undefined;
    const days = Math.floor(daysOld(dateString));
    if (days < 1) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
};

const ReferralsListMobile: React.FC<ReferralsListMobileProps> = ({ orders, isLoading, onViewDetails }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const groupedReferrals = useMemo(() => {
    if (!orders) return [];
    const groups: { type: 'header'; letter: string }[] | { type: 'order'; order: Order }[] = [];
    const sortedOrders = [...orders].sort((a, b) => (a.patients?.name || '').localeCompare(b.patients?.name || ''));
    
    let currentLetter = '';
    sortedOrders.forEach(order => {
      const firstLetter = (order.patients?.name || '')[0]?.toUpperCase();
      const key = (firstLetter && /^[A-Z]$/.test(firstLetter)) ? firstLetter : '#';
      if (key !== currentLetter) {
        currentLetter = key;
        groups.push({ type: 'header', letter: key });
      }
      groups.push({ type: 'order', order });
    });
    return groups;
  }, [orders]);

  const rowVirtualizer = useVirtualizer({
    count: groupedReferrals.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => groupedReferrals[index].type === 'header' ? 36 : 65, // Estimate header height vs row height
    overscan: 5,
  });

  if (isLoading) {
    return <ListSkeleton rows={10} />;
  }

  if (orders.length === 0) {
    return (
      <div className="p-4">
        <EmptyState 
            title="No Referrals Found"
            message="No records match the current search or filters."
        />
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full w-full overflow-y-auto">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const item = groupedReferrals[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {item.type === 'header' ? (
                <div className="bg-gray-100 dark:bg-zinc-800/50 px-4 py-1 sticky top-0 z-10">
                    <h2 className="text-sm font-bold uppercase text-muted">{item.letter}</h2>
                </div>
              ) : (
                <CompactReferralRow
                    name={item.order.patients?.name || 'Unknown Patient'}
                    payer={item.order.patients?.primary_insurance}
                    statusColor={item.order.stoplight_status || 'green'}
                    lastTouch={formatRelativeTime(item.order.updated_at)}
                    onOpen={() => onViewDetails(item.order)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReferralsListMobile;
