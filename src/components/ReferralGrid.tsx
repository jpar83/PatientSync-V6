import React, { useRef } from 'react';
import type { Order } from '../lib/types';
import ReferralCard from './ReferralCard';
import EmptyState from './ui/EmptyState';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ReferralGridProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onStageChange: (order: Order) => void;
  onArchive: (order: Order) => void;
  onDelete: (order: Order) => void;
  onExportSnapshot: (order: Order) => void;
  exportingSnapshotId: string | null;
  term?: string;
  selectedOrderIds: string[];
  onToggleSelection: (orderId: string) => void;
  onUpdate: () => void;
}

const ReferralGrid: React.FC<ReferralGridProps> = ({
  orders,
  onViewDetails,
  onStageChange,
  onArchive,
  onDelete,
  onExportSnapshot,
  exportingSnapshotId,
  term,
  selectedOrderIds,
  onToggleSelection,
  onUpdate,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // Estimate row height
    overscan: 5,
  });

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
      <ul
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const order = orders[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ReferralCard
                order={order}
                onViewDetails={() => onViewDetails(order)}
                onStageChange={() => onStageChange(order)}
                onArchive={() => onArchive(order)}
                onDelete={() => onDelete(order)}
                onExportSnapshot={() => onExportSnapshot(order)}
                isExporting={exportingSnapshotId === order.id}
                term={term}
                isSelected={selectedOrderIds.includes(order.id)}
                onToggleSelection={() => onToggleSelection(order.id)}
                onUpdate={onUpdate}
              />
            </div>
          );
        })}
      </ul>
    </div>
  );
};

export default ReferralGrid;
