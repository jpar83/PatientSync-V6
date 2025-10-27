import React from "react";
import { WorkflowHistoryEntry } from '../lib/types';
import { isBackward } from '../lib/utils';

interface RegressionAnalyticsProps {
  history: WorkflowHistoryEntry[];
}

export default function RegressionAnalytics({ history }: RegressionAnalyticsProps) {
  const regressions = history.filter(h => isBackward(h.previous_stage, h.new_stage));
  
  const reasons = regressions.map(h => h.note).filter((note): note is string => note !== null && note !== undefined);
  
  const topReasons = Object.entries(
    reasons.reduce((acc: Record<string, number>, word: string) => {
      const key = word.toLowerCase().split(" ").slice(0, 3).join(" ");
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-3 border-l-4 border-red-500 pl-2">Regression Insights</h2>
      <p className="text-sm text-muted mb-4">Top reasons cases moved backward in the workflow.</p>
      {topReasons.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No regression activity recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {topReasons.map(([reason, count]) => (
            <li key={reason} className="flex items-center justify-between text-sm bg-white dark:bg-surface p-3 rounded-lg shadow-sm">
              <span className="capitalize text-text">{reason}</span>
              <span className="font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">{count} times</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
