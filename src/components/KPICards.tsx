import React, { useMemo } from 'react';
import { Order } from '../lib/types';
import { Users, FileWarning, ShieldX } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  orders: Order[];
  totalDenials: number;
  onMissingDocsClick?: () => void;
  onDenialsClick?: () => void;
}

export default function KPICards({ orders, totalDenials, onMissingDocsClick, onDenialsClick }: KPICardsProps) {
  const open = orders.length;
  
  const missingDocs = useMemo(() => {
    return orders.filter(order => {
        const required = order.patients?.required_documents || [];
        if (required.length === 0) return false;
        const isComplete = required.every(doc => order.document_status?.[doc] === 'Complete');
        return !isComplete;
    }).length;
  }, [orders]);
  
  const cards = [
    { title: "Total Open Orders", value: open, icon: Users, color: 'text-teal-600 dark:text-teal-400' },
    { title: "Missing Docs", value: missingDocs, icon: FileWarning, color: 'text-amber-600 dark:text-amber-400', onClick: onMissingDocsClick },
    { title: "Total Denials", value: totalDenials, icon: ShieldX, color: 'text-red-600 dark:text-red-400', onClick: onDenialsClick },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      {cards.map(c => {
        const isClickable = !!c.onClick && (typeof c.value !== 'number' || c.value > 0);
        return (
            <motion.div 
              key={c.title} 
              className={cn(
                "bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 transition-shadow",
                isClickable ? "hover:shadow-lg cursor-pointer focus-ring" : (c.onClick ? "opacity-60 cursor-not-allowed" : "")
              )}
              whileTap={isClickable ? { scale: 0.98 } : {}}
              onClick={isClickable ? c.onClick : undefined}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={isClickable ? (e) => (e.key === 'Enter' || e.key === ' ') && c.onClick?.() : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted truncate">{c.title}</div>
                  <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                </div>
                <c.icon className="h-5 w-5 text-muted flex-shrink-0" />
              </div>
            </motion.div>
        );
      })}
    </div>
  );
}
