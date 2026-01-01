import React from 'react';
import Modal from '../ui/Modal';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  variant?: 'danger' | 'success';
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Підтвердити',
  variant = 'danger',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const iconMap = {
    danger: <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />,
    success: <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />,
  };

  const iconBgColorMap = {
    danger: 'bg-red-100',
    success: 'bg-green-100',
  };

  const buttonColorMap = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="sm:flex sm:items-start">
        <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconBgColorMap[variant]} sm:mx-0 sm:h-10 sm:w-10`}>
          {iconMap[variant]}
        </div>
        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
          {/* FIX: Ensure title text color has sufficient contrast with the modal background */}
          <h3 className="text-lg leading-6 font-bold text-slate-800">{title}</h3>
          <div className="mt-2">
            {/* FIX: Set message color to a standard readable slate for light themes */}
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse border-t border-slate-100 pt-4">
        <button
          type="button"
          className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${buttonColorMap[variant]}`}
          onClick={handleConfirm}
        >
          {confirmButtonText}
        </button>
        <button
          type="button"
          className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          onClick={onClose}
        >
          Скасувати
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmActionModal;