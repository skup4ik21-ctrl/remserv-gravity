import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
}

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ isOpen, onClose, imageSrc }) => {
  if (!isOpen || !imageSrc) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex justify-center items-center p-4 transition-opacity duration-300" 
      aria-modal="true" 
      role="dialog"
      onClick={onClose}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 p-2 rounded-full text-white bg-black bg-opacity-50 hover:bg-opacity-75 focus:outline-none z-10" 
        aria-label="Close image viewer"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>
      <div 
        className="relative max-w-full max-h-full"
        onClick={e => e.stopPropagation()}
      >
        <img 
          src={imageSrc} 
          alt="Enlarged view" 
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
        />
      </div>
    </div>
  );
};

export default PhotoViewerModal;
