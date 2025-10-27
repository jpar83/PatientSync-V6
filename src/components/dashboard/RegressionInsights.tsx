import React from 'react';
import { Loader2 } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

interface RegressionInsightsProps {
  insights: { reason: string; count: number }[];
  isLoading: boolean;
}

const RegressionInsights: React.FC<RegressionInsightsProps> = ({ insights, isLoading }) => {
  if (isLoading) {
    return <div className="soft-card p-4 h-full flex justify-center items-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }

  if (!insights || insights.length === 0) {
    return (
        <EmptyState title="No Regressions" message="No cases have moved backward in the workflow recently." />
    );
  }

  const totalRegressions = insights.reduce((sum, item) => sum + item.count, 0);

  return (
      <div className="space-y-2">
        {insights.map((item) => (
          <div key={item.reason}>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">{item.reason}</span>
              <span className="font-semibold text-text">{item.count}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5 mt-1">
              <div
                className="bg-red-500 h-1.5 rounded-full"
                style={{ width: `${(item.count / totalRegressions) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
  );
};

export default RegressionInsights;
