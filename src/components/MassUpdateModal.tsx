import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Button } from './ui/button';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { Loader2 } from 'lucide-react';
import type { WorkflowStage } from '../lib/types';

interface MassUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { newStage: WorkflowStage; note: string }) => Promise<void>;
  selectedCount: number;
  stages: WorkflowStage[];
}

const MassUpdateModal: React.FC<MassUpdateModalProps> = ({ isOpen, onClose, onConfirm, selectedCount, stages }) => {
  const [newStage, setNewStage] = useState<WorkflowStage | ''>('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    if (!newStage || !note.trim()) return;
    setIsSaving(true);
    await onConfirm({ newStage, note });
    setIsSaving(false);
  };

  const stageOptions = stages.map(s => ({ label: s, value: s }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>Bulk Stage Update</DialogHeader>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            You are about to update the workflow stage for <span className="font-bold text-text">{selectedCount}</span> selected referrals.
          </p>
          <Select
            label="New Stage"
            value={newStage}
            options={stageOptions}
            onChange={(e) => setNewStage(e.target.value as WorkflowStage)}
          />
          <Textarea
            label="Reason for Change (Note)"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Required: Provide a note for the audit log for all selected referrals."
            required
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isSaving || !newStage || !note.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Confirm Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MassUpdateModal;
