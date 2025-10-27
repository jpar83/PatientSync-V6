import React from 'react';
import { Btn } from './Btn';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './Dialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  confirmButtonVariant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

const SimpleConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'primary',
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>{title}</DialogHeader>
        <div className="p-6 text-sm text-gray-700 dark:text-gray-300">
          {message}
        </div>
        <DialogFooter className="flex-row justify-end">
          <Btn variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Btn>
          <Btn
            onClick={onConfirm}
            disabled={isLoading}
            variant={confirmButtonVariant}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {isLoading ? 'Processing...' : confirmButtonText}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleConfirmationModal;
