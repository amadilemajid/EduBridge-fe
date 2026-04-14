import React from 'react';

const LoadingSpinner = ({ variant = 'inline', size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center text-primary-600">
      <div className={`animate-spin rounded-full border-t-transparent border-current ${sizeClasses[size]} mb-3`} role="status" aria-label="loading">
        <span className="sr-only">Loading...</span>
      </div>
      {message && <p className="text-sm text-gray-500 animate-pulse">{message}</p>}
    </div>
  );

  if (variant === 'full') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50/80 z-50 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return <div className="p-4 flex items-center justify-center w-full h-full">{spinner}</div>;
};

export default LoadingSpinner;
