import React from 'react';
import { cn } from '@/lib/utils';
import workflowData from '../../schemas/workflow.json';
import type { WorkflowStage } from '@/lib/types';

interface MiniPipelineProps {
  currentStage: WorkflowStage;
  className?: string;
}

const allStages = workflowData.workflow.map(w => w.stage) as WorkflowStage[];

const MiniPipeline: React.FC<MiniPipelineProps> = ({ currentStage, className }) => {
  const currentIndex = allStages.indexOf(currentStage);

  return (
    <div className={cn("flex items-center gap-1 w-full", className)}>
      {allStages.map((stage, index) => {
        let status: 'completed' | 'active' | 'future';
        if (index < currentIndex) {
          status = 'completed';
        } else if (index === currentIndex) {
          status = 'active';
        } else {
          status = 'future';
        }

        return (
          <div
            key={stage}
            title={stage}
            className={cn("h-1 rounded-full flex-1 transition-all", {
              'bg-teal-500': status === 'completed',
              'bg-teal-500 scale-y-150': status === 'active',
              'bg-gray-200 dark:bg-zinc-700': status === 'future',
            })}
          />
        );
      })}
    </div>
  );
};

export default MiniPipeline;
