import React from 'react';
import { Btn as Button } from './ui/Btn';
import { Edit } from 'lucide-react';
import type { Patient, Order } from '../lib/types';
import { daysOld } from '../lib/utils';
import StageRequirementsChecklist from './StageRequirementsChecklist';
import workflowData from '../../schemas/workflow.json';
import NotesPanel from './NotesPanel';

interface WorkflowHubProps {
  order: Order | null;
  patient: Patient;
  onStageChangeClick: () => void;
  onAddNoteClick: () => void;
  onUpdate: () => void;
}

const WorkflowHub: React.FC<WorkflowHubProps> = ({ order, patient, onStageChangeClick, onAddNoteClick, onUpdate }) => {
  if (!order) {
    return <div className="p-4 text-center text-muted">No active order for this patient.</div>;
  }
  
  const daysInStage = Math.floor(daysOld(order.last_stage_change));
  const required = patient.required_documents || [];
  const completedCount = required.filter(doc => order.document_status?.[doc] === 'Complete').length;
  const isReadyForPar = required.length > 0 && completedCount === required.length;

  const stageConfig = workflowData.workflow.find(s => s.stage === order.workflow_stage);
  const targetDays = stageConfig?.target_days;
  const isOverdue = targetDays && daysInStage > targetDays;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
        <div>
          <p className="text-xs text-muted">Current Stage</p>
          <p className="text-base font-semibold text-accent">{order.workflow_stage}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <p className="text-xs text-muted">Days in Stage</p>
                <p className={`text-base font-semibold ${isOverdue ? 'text-red-500' : 'text-text'}`}>
                    {daysInStage}
                    {targetDays && <span className="text-xs font-normal text-muted"> / {targetDays}d target</span>}
                </p>
                 {isOverdue && <p className="text-xs text-red-500">Over target by {daysInStage - targetDays!}d</p>}
            </div>
            <div>
                <p className="text-xs text-muted">PAR Readiness</p>
                <p className={`text-base font-semibold ${isReadyForPar ? 'text-green-500' : 'text-amber-500'}`}>
                    {isReadyForPar ? 'Ready' : 'Not Ready'}
                </p>
            </div>
        </div>
        <div className="flex gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button size="sm" onClick={onStageChangeClick} className="flex-1">
                <Edit className="h-4 w-4 mr-2" /> Change Stage
            </Button>
        </div>
      </div>

      {/* Requirements */}
      <StageRequirementsChecklist 
        patient={patient}
        order={order}
      />

      {/* Notes Panel */}
      <NotesPanel 
        patientId={patient.id}
        onAddNoteClick={onAddNoteClick}
        onUpdate={onUpdate}
      />
    </div>
  );
};

export default WorkflowHub;
