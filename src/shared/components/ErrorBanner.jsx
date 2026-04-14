import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorBanner = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50/80 border border-red-100 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm my-4 w-full">
      <div className="bg-white rounded-full p-1 shadow-sm mt-0.5">
        <AlertCircle className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-red-900 leading-tight mb-1">Error Encountered</h4>
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-sm font-medium px-3 py-1.5 bg-white text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
