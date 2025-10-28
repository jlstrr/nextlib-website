import React from "react";
import { Modal } from "./index";
import Button from "../button/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Confirm",
  message = "Are you sure?",
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="max-w-md p-6">
      <div className="px-1 py-1">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onConfirm()}
            className="rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
