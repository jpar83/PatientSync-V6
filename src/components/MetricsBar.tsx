import React from "react";
import { FileCheck, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface Metrics {
  total: number;
  ready: number;
  avgDays: number;
}

interface Props {
  metrics: Metrics;
  onDocsCompleteClick?: () => void;
}

const ProgressBar: React.FC<{ value: number, color?: string }> = ({ value, color = "bg-teal-500" }) => (
  <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 my-1">
    <div 
      className={cn("h-2 rounded-full transition-all duration-500", color)}
      style={{ width: `${value}%` }}
    />
  </div>
);

export default function MetricsBar({ metrics, onDocsCompleteClick }: Props) {
  const pct = metrics.total > 0 ? Math.round((metrics.ready / metrics.total) * 100) : 0;

  const metricCards = [
    {
      title: "Docs Complete %",
      icon: FileCheck,
      color: 'text-teal-500',
      content: (
        <div className="flex items-center gap-3 mt-1">
          <ProgressBar value={pct} />
          <span className="text-2xl font-bold text-teal-500">{pct}%</span>
        </div>
      ),
      onClick: onDocsCompleteClick
    },
    {
      title: "Avg Days in Stage",
      icon: Clock,
      color: 'text-amber-500',
      content: <div className="text-2xl font-bold text-amber-500 mt-1">{(metrics.avgDays || 0).toFixed(2)}</div>
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {metricCards.map(card => (
        <motion.div 
          key={card.title} 
          className={cn(
            "bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 transition-all",
            card.onClick && "hover:shadow-lg cursor-pointer focus-ring"
          )}
          whileTap={card.onClick ? { scale: 0.98 } : {}}
          onClick={card.onClick}
          role={card.onClick ? 'button' : undefined}
          tabIndex={card.onClick ? 0 : undefined}
          onKeyDown={card.onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && card.onClick?.() : undefined}
        >
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-muted">{card.title}</div>
            <card.icon className="h-4 w-4 text-muted" />
          </div>
          {card.content}
        </motion.div>
      ))}
    </div>
  );
}
