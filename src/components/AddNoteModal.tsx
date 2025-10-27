import React, { useState, useEffect } from 'react';
import { Btn } from './ui/Btn';
import { Textarea } from './ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
  initialNote?: string;
  title?: string;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({ isOpen, onClose, onSave, initialNote = '', title = 'Add a Note' }) => {
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNote(initialNote);
    }
  }, [isOpen, initialNote]);

  const handleSave = async () => {
    if (!note.trim()) return;
    setIsSaving(true);
    await onSave(note);
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>{title}</DialogHeader>
        <div className="p-6">
          <Textarea
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for the audit log..."
            rows={4}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={isSaving || !note.trim()}>
            {isSaving ? 'Saving...' : 'Save Note'}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteModal;
