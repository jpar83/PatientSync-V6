import React from 'react';
import { Loader2 } from 'lucide-react';

const SplashScreen: React.FC<{ text?: string }> = ({ text = 'Starting...' }) => (
  <div className="flex flex-col justify-center items-center h-screen bg-surface text-text">
    <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
    <p className="text-lg font-medium">{text}</p>
  </div>
);

export default SplashScreen;
