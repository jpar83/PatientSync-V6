import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardKpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  status: 'good' | 'warning' | 'danger' | 'neutral';
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  progress?: number;
  onClick?: () => void;
}

const statusConfig = {
  good: {
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/30',
    progress: 'bg-green-500',
  },
  warning: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    progress: 'bg-amber-500',
  },
  danger: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30',
    progress: 'bg-red-500',
  },
  neutral: {
    text: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    progress: 'bg-teal-500',
  },
};

const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({ title, value, icon: Icon, status, trend, progress, onClick }) => {
  const config = statusConfig[status];
  const isClickable = !!onClick;

  return (
    <motion.div
      className={cn(
        "soft-card p-4 transition-all h-full flex flex-col",
        isClickable ? "hover:shadow-lg cursor-pointer focus-ring" : (onClick ? "opacity-60 cursor-not-allowed" : "")
      )}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={isClickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick?.() : undefined}
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg", config.bg)}>
          <Icon className={cn("h-5 w-5", config.text)} />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center text-xs font-semibold',
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.direction === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            <span className="ml-1">{trend.value}</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex-1">
        <p className="text-sm text-muted">{title}</p>
        <p className="text-2xl font-bold text-text">{value}</p>
      </div>
      {progress !== undefined && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
            <div
              className={cn("h-1.5 rounded-full transition-all duration-500", config.progress)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DashboardKpiCard;
