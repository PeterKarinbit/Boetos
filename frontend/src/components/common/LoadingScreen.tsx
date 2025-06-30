import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Boetos
        </h1>
        <p className="text-blue-100 mb-8">Boetos, the AI that lets you focus while it handles the rest.</p>
        
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-blue-300 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-t-4 border-b-4 border-blue-200 animate-spin animation-delay-150"></div>
            <div className="absolute inset-6 rounded-full border-t-4 border-b-4 border-blue-100 animate-spin animation-delay-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;