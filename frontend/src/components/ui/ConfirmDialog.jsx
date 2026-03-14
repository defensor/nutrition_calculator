import React from 'react';
import { useDialog } from '../../context/DialogContext';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = () => {
  const { dialogConfig } = useDialog();

  if (!dialogConfig) return null;

  return (
    <Modal
      isOpen={!!dialogConfig}
      onClose={() => dialogConfig.resolve(false)}
      title={dialogConfig.title || 'Confirmation'}
    >
      <div className="space-y-4">
        <p className="text-gray-600">{dialogConfig.message}</p>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => dialogConfig.resolve(false)}
          >
            {dialogConfig.cancelText || 'Cancel'}
          </Button>
          <Button
            variant={dialogConfig.confirmVariant || 'primary'}
            onClick={() => dialogConfig.resolve(true)}
            autoFocus
          >
            {dialogConfig.confirmText || 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
