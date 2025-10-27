import React from 'react';
import { cn } from '../../lib/utils';
import type { ReferralStatus } from '../../lib/types';

interface StatusBadgeProps {
  status: ReferralStatus;
}

const statusColorMap: Record<ReferralStatus, string> = {
  Referral: 'bg-blue-100 text-blue-800',
  'F2F Needed': 'bg-red-100 text-red-800',
  'PT Eval Pending': 'bg-yellow-100 text-yellow-800',
  'SWO Created': 'bg-indigo-100 text-indigo-800',
  'DPD Sent': 'bg-purple-100 text-purple-800',
  'Telehealth Done': 'bg-cyan-100 text-cyan-800',
  'AOR Received': 'bg-teal-100 text-teal-800',
  Shipped: 'bg-green-100 text-green-800',
  Billed: 'bg-lime-100 text-lime-800',
  Archived: 'bg-gray-100 text-gray-800',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusColorMap[status] || 'bg-gray-100 text-gray-800'
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
