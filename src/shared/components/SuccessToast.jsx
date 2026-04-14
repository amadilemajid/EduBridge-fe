import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

const SuccessToast = ({ message, visible, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-100 shadow-lg rounded-xl p-4 flex items-center gap-3 w-80 max-w-full">
        <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
        <p className="text-sm font-medium text-emerald-800 flex-1">{message}</p>
        <button 
          onClick={onClose}
          className="text-emerald-600 hover:text-emerald-900 p-1.5 rounded-md hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          aria-label="Close message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SuccessToast;
