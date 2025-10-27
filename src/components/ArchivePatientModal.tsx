import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/Textarea';
import { Loader2 } from 'lucide-react';

interface ArchivePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
  isArchiving: boolean;
  patientName: string;
  isArchived: boolean;
}

const ArchivePatientModal: React.FC<ArchivePatientModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isArchiving,
  patientName,
  isArchived,
}) => {
  const [note, setNote] = useState('');

  const handleConfirm = async () => {
    if (!note.trim()) return;
    await onConfirm(note);
    setNote(''); // Reset after confirm
  };

  const title = isArchived ? 'Restore Patient' : 'Archive Patient';
  const message = isArchived
    ? `Please provide a reason for restoring ${patientName}.`
    : `Please provide a reason for archiving ${patientName}. This will also archive all associated referrals.`;
  const buttonText = isArchived ? 'Restore Patient' : 'Archive Patient';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>{title}</DialogHeader>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">{message}</p>
          <Textarea
            label="Reason (required)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Enter reason for audit log..."
            required
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isArchiving}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isArchiving || !note.trim()}
            variant={isArchived ? 'default' : 'destructive'}
          >
            {isArchiving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ArchivePatientModal;
