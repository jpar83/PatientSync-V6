import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface DashboardKpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  delta?: number;
  deltaType?: 'percent' | 'number';
  sparklineData?: { value: number }[];
  onClick?: () => void;
  className?: string;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({ title, value, icon: Icon, delta, deltaType = 'number', sparklineData, onClick, className }) => {
  const isClickable = !!onClick;
  const hasDelta = typeof delta === 'number';
  const isPositive = hasDelta && delta > 0;
  const isNegative = hasDelta && delta < 0;
  const isNeutral = hasDelta && delta === 0;

  const deltaConfig = {
    positive: { text: 'text-green-600', bg: 'bg-green-100/60 dark:bg-green-900/30', icon: ArrowUp },
    negative: { text: 'text-red-600', bg: 'bg-red-100/60 dark:bg-red-900/30', icon: ArrowDown },
    neutral: { text: 'text-muted', bg: 'bg-gray-100 dark:bg-zinc-800', icon: Minus },
  };

  const deltaStatus = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
  const config = deltaConfig[deltaStatus];
  const DeltaIcon = config.icon;

  const formatDelta = () => {
    if (!hasDelta) return null;
    const absDelta = Math.abs(delta);
    if (deltaType === 'percent') {
      return `${absDelta.toFixed(1)}%`;
    }
    return absDelta.toFixed(0);
  };

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "soft-card p-3 transition-all h-full flex flex-col justify-between",
        isClickable ? "hover:shadow-lg cursor-pointer focus-ring" : "",
        className
      )}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : -1}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted">{title}</p>
        <div className="bg-pc-blue-50 p-1.5 rounded-lg">
          <Icon className="h-4 w-4 text-pc-blue-700" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2 mt-1">
        <p className="text-2xl font-bold text-text">{value}</p>
        {hasDelta && (
          <div className={cn("flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md", config.bg, config.text)}>
            <DeltaIcon className="h-3 w-3" />
            <span>{formatDelta()}</span>
          </div>
        )}
      </div>
      {sparklineData && sparklineData.length > 1 && (
        <div className="h-8 -mx-3 -mb-2 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`color-${deltaStatus}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : isNegative ? '#ef4444' : '#6b7280'} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : isNegative ? '#ef4444' : '#6b7280'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={isPositive ? '#10b981' : isNegative ? '#ef4444' : '#6b7280'} strokeWidth={1.5} fill={`url(#color-${deltaStatus})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default DashboardKpiCard;
