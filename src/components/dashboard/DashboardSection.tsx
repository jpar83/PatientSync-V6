import React, { useState, ReactNode, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface DashboardSectionProps {
  id: string;
  title: ReactNode;
  icon: React.ElementType;
  children: ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ id, title, icon: Icon, children, className, actions }) => {
  const { prefs, setPrefs } = usePreferences();

  const [isOpen, setIsOpen] = useState(() => {
    if (prefs.rememberDashboardLayout && prefs.dashboardLayout && prefs.dashboardLayout[id] !== undefined) {
      return prefs.dashboardLayout[id];
    }
    return false; // Default to collapsed
  });

  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (prefs.rememberDashboardLayout) {
      setPrefs(p => ({
        ...p,
        dashboardLayout: {
          ...p.dashboardLayout,
          [id]: newIsOpen,
        },
      }));
    }
  };

  return (
    <div className={cn("soft-card flex flex-col", className)}>
      <header className="flex items-center justify-between p-3">
        <button
          type="button"
          onClick={toggleOpen}
          className="flex flex-1 items-center gap-2 text-left group"
          aria-expanded={isOpen}
        >
          <div className="bg-pc-blue-50 p-1.5 rounded-md">
            <Icon className="h-4 w-4 text-pc-blue-700" />
          </div>
          <h3 className="font-semibold text-sm text-text">{title}</h3>
          <ChevronDown className={cn("h-4 w-4 text-muted group-hover:text-text transition-transform transform ml-1", isOpen && "rotate-180")} />
        </button>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </header>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-border-color">
              <div className="pt-3">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardSection;
