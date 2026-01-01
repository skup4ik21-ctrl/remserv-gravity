
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses: { [key: string]: string } = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center items-start pt-10 sm:pt-20 px-4" 
      aria-modal="true" 
      role="dialog"
      onClick={onClose}
    >
        {/* Glass Backdrop */}
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" />

      <div 
        className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/10 w-full ${sizeClasses[size] || 'max-w-lg'} transform transition-all relative border border-white/60 flex flex-col max-h-[90vh] z-50 animate-fade-in-up`}
        onClick={e => e.stopPropagation()}
        role="document"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-2xl font-bold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
       <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        /* Style for inputs inside modals globally to ensure light theme consistency */
        input, select, textarea {
            background-color: #f8fafc; /* slate-50 */
            border-color: #e2e8f0; /* slate-200 */
            color: #1e293b; /* slate-800 */
            transition: all 0.2s;
        }
        input:focus, select:focus, textarea:focus {
            background-color: #ffffff;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        label {
            color: #475569; /* slate-600 */
        }
      `}</style>
    </div>
  );
};

export default Modal;
