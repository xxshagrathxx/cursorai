import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <div className="w-8 h-8 bg-white rounded-full"></div>
        </div>
        
        {/* Loading Spinner */}
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        
        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          DentalCare
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Loading your dental practice...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;