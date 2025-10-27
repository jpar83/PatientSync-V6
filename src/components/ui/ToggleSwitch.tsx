import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, description }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-200">
      <div className="flex-grow">
        <span className="font-medium text-gray-700">{label}</span>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative flex items-center h-7 w-12 rounded-full transition-colors',
          checked ? 'bg-teal-600' : 'bg-gray-200'
        )}
      >
        <motion.div
          className="h-5 w-5 bg-white rounded-full shadow-md"
          layout
          transition={{ type: 'spring', stiffness: 700, damping: 30 }}
          style={{
            position: 'absolute',
            left: checked ? 'auto' : '4px',
            right: checked ? '4px' : 'auto',
          }}
        />
      </div>
    </label>
  );
};

export default ToggleSwitch;
