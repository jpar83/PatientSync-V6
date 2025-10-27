import React, { useState, useEffect, useMemo } from 'react';
import { Info } from 'lucide-react';
import { Btn } from './ui/Btn';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import type { WorkflowStage, Order } from '../lib/types';
import { isBackward } from '../lib/utils';
import { regressionReasonOptions } from '../lib/formConstants';
import { toast } from '../lib/toast';

interface StageChangeModalProps {
  current: WorkflowStage;
  stages: WorkflowStage[];
  onSave: (update: { newStage: WorkflowStage; note: string; regressionReason?: string }) => void;
  onClose: () => void;
  order: Order;
}

const StageChangeModal: React.FC<StageChangeModalProps> = ({ current, stages, onSave, onClose, order }) => {
  const [newStage, setNewStage] = useState<WorkflowStage>(current);
  const [note, setNote] = useState('');
  const [regressionReason, setRegressionReason] = useState('');
  const [isParReady, setIsParReady] = useState(false);
  const [parMissingReasons, setParMissingReasons] = useState<string[]>([]);

  const isRegression = useMemo(() => isBackward(current, newStage), [current, newStage]);

  useEffect(() => {
    const reasons: string[] = [];
    const requiredDocs = order.patients?.required_documents || [];
    
    const missingCoreDocs = requiredDocs.filter(docKey => order.document_status?.[docKey] !== 'Complete');
    
    if (missingCoreDocs.length > 0) {
        reasons.push(`Missing documents: ${missingCoreDocs.join(', ')}`);
    }
    
    setParMissingReasons(reasons);
    setIsParReady(reasons.length === 0);
  }, [order]);

  const handleSave = () => {
    if (isRegression && !regressionReason) {
      toast('A reason is required for stage regressions.', 'err');
      return;
    }
    if (newStage && note.trim()) {
      onSave({ newStage, note, regressionReason: isRegression ? regressionReason : undefined });
    } else {
      toast('A note is required for all stage changes.', 'err');
    }
  };
  
  const stageOptions = stages.map(s => {
      const isParStage = s === 'Preauthorization (PAR)';
      const isDisabled = isParStage && !isParReady;
      return { label: s, value: s, disabled: isDisabled };
  });

  const isSaveDisabled = newStage === current || !note.trim() || (isRegression && !regressionReason);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-lg w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-text">Change Workflow Stage</h2>
            <p className="text-sm text-gray-500 dark:text-muted mt-1">This change will be logged as a new note.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-muted">Current Stage</p>
            <p className="mt-1 text-sm font-semibold text-accent">{current}</p>
          </div>
          <Select
            label="New Stage"
            value={newStage}
            options={stageOptions}
            onChange={(e) => setNewStage(e.target.value as WorkflowStage)}
          />

          {isRegression && (
            <Select
              label="Reason for Regression"
              value={regressionReason}
              options={regressionReasonOptions}
              onChange={(e) => setRegressionReason(e.target.value)}
              required
            />
          )}

          {newStage === 'Preauthorization (PAR)' && !isParReady && (
            <div className="flex items-start p-3 text-sm text-red-800 bg-red-50 dark:bg-red-900/40 dark:text-red-200 rounded-lg" role="alert">
              <Info className="flex-shrink-0 inline w-5 h-5 mr-3"/>
              <div>
                <span className="font-medium">Cannot move to PAR.</span>
                <ul className="mt-1.5 ml-4 list-disc list-inside">
                    {parMissingReasons.map(reason => <li key={reason}>{reason}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-start p-3 text-sm text-blue-800 bg-blue-50 dark:bg-blue-900/40 dark:text-blue-200 rounded-lg" role="alert">
            <Info className="flex-shrink-0 inline w-4 h-4 mr-3 mt-0.5"/>
            <p>A note is required for all stage changes to maintain a clear audit trail.</p>
          </div>

          <Textarea
            label="Reason for Change (Note)"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Required: Please provide context for this stage change..."
            required={true}
          />
        </div>

        <div className="p-4 flex justify-end gap-3 bg-gray-50 dark:bg-black/20 rounded-b-xl">
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={handleSave} disabled={isSaveDisabled}>
            Confirm Change
          </Btn>
        </div>
      </div>
    </div>
  );
};

export default StageChangeModal;
