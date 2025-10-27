import React from 'react';
import { AlertTriangle } from 'lucide-react';

const FatalScreen: React.FC<{ message: string; detail?: string }> = ({ message, detail }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-center p-4">
    <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
    <h1 className="text-2xl font-bold text-red-800">{message}</h1>
    <p className="mt-2 text-red-600">
      The application failed to start. Please check your configuration and network connection.
    </p>
    {detail && (
        <pre className="mt-4 text-xs bg-red-100 p-3 rounded-md text-red-700 text-left max-w-lg overflow-auto">
            {detail}
        </pre>
    )}
    <button
      onClick={() => window.location.reload()}
      className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
    >
      Retry
    </button>
  </div>
);

export default FatalScreen;
