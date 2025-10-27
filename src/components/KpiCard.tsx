import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';
import type { KpiData } from '../lib/types';

const KpiCard: React.FC<{ data: KpiData }> = ({ data }) => {
  const { title, value, change, changeType } = data;
  const isIncrease = changeType === 'increase';

  return (
    <div className="bg-white shadow-md rounded-2xl p-4">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <div className="mt-1 flex items-baseline justify-between">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <div
          className={cn(
            'flex items-baseline text-sm font-semibold',
            isIncrease ? 'text-green-600' : 'text-red-600'
          )}
        >
          {isIncrease ? (
            <ArrowUp className="h-4 w-4 self-center flex-shrink-0" />
          ) : (
            <ArrowDown className="h-4 w-4 self-center flex-shrink-0" />
          )}
          <span className="ml-1">{change}</span>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
