import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ title = 'No Data Found', message = 'There are no items to display here yet.', actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm w-full mx-auto max-w-lg my-8">
      <div className="bg-gray-50 p-4 rounded-full mb-4">
        <PackageOpen className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors focus:ring-4 focus:ring-primary-100 outline-none"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
