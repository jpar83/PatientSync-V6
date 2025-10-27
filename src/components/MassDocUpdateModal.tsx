import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/Checkbox';
import { Textarea } from './ui/Textarea';
import { Loader2 } from 'lucide-react';
import { docTemplates, labelMap, DocKey } from '../lib/docMapping';

interface MassDocUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { docKeys: string[]; note: string }) => Promise<void>;
  selectedCount: number;
}

const allDocKeys = Array.from(new Set(docTemplates.flatMap(t => t.keys)));

const MassDocUpdateModal: React.FC<MassDocUpdateModalProps> = ({ isOpen, onClose, onConfirm, selectedCount }) => {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleDoc = (docKey: string) => {
    setSelectedDocs(prev =>
      prev.includes(docKey) ? prev.filter(d => d !== docKey) : [...prev, docKey]
    );
  };

  const handleConfirm = async () => {
    if (selectedDocs.length === 0 || !note.trim()) return;
    setIsSaving(true);
    await onConfirm({ docKeys: selectedDocs, note });
    setIsSaving(false);
  };

  const handleClose = () => {
    if (isSaving) return;
    setSelectedDocs([]);
    setNote('');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>Bulk Document Update</DialogHeader>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            Select documents to mark as "Complete" for the <span className="font-bold text-text">{selectedCount}</span> selected referrals.
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto border p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
            {allDocKeys.map(docKey => (
              <Checkbox
                key={docKey}
                label={labelMap[docKey as DocKey] || docKey}
                checked={selectedDocs.includes(docKey)}
                onChange={() => handleToggleDoc(docKey)}
              />
            ))}
          </div>
          <Textarea
            label="Reason for Update (Note)"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Required: e.g., 'Received signed F2F from Dr. Smith's office.'"
            required
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isSaving || selectedDocs.length === 0 || !note.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Confirm Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MassDocUpdateModal;
