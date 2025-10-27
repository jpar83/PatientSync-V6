import React, { useState } from 'react';
import { Btn } from './Btn';
import { Input } from './Input';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './Dialog';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  isResetting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  isResetting,
  onClose,
  onConfirm,
}) => {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setStep(1);
    setConfirmText('');
    onClose();
  };

  const handleFinalConfirm = () => {
    if (confirmText === 'RESET') {
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>Confirm Dataset Reset</DialogHeader>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This will **permanently delete all patient and referral records**. This action is irreversible and will be logged.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Are you absolutely sure you want to proceed?</p>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                To confirm, please type **RESET** in the box below.
              </p>
              <Input
                label="Confirmation"
                id="reset-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoFocus
              />
            </>
          )}
        </div>

        <DialogFooter className="flex-row justify-end">
          <Btn variant="outline" onClick={handleClose} disabled={isResetting}>
            Cancel
          </Btn>
          {step === 1 && (
            <Btn onClick={() => setStep(2)} variant="danger">
              I Understand, Continue
            </Btn>
          )}
          {step === 2 && (
            <Btn
              onClick={handleFinalConfirm}
              disabled={confirmText !== 'RESET' || isResetting}
              variant="danger"
            >
              {isResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Reset
            </Btn>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetConfirmationModal;
