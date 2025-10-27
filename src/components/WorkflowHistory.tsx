import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { WorkflowHistoryEntry } from '../lib/types';

interface WorkflowHistoryProps {
  history: WorkflowHistoryEntry[];
}

const WorkflowHistory: React.FC<WorkflowHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg">
        No workflow history available.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {history.map((item, itemIdx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {itemIdx !== history.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center ring-8 ring-white">
                    <ArrowRight className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Stage changed from{' '}
                      <span className="font-medium text-gray-900">{item.previous_stage}</span> to{' '}
                      <span className="font-medium text-gray-900">{item.new_stage}</span> by{' '}
                      <span className="font-medium text-gray-900">{item.changed_by}</span>.
                    </p>
                    <p className="mt-2 text-sm text-gray-700 italic border-l-2 border-gray-200 pl-2">
                      "{item.note}"
                    </p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <time dateTime={item.changed_at}>
                      {new Date(item.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkflowHistory;
