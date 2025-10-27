import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Plus } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import MultiSelect from '@/components/ui/MultiSelect';
import { Button } from '@/components/ui/button';
import MarketingFilterDrawer from './MarketingFilterDrawer';
import type { LeadStatus, MarketingEventType, InServiceStatus } from '@/lib/types';
import { marketingEventTypeOptions } from '@/lib/formConstants';

interface MarketingFilterBarProps {
  activeView: 'leads' | 'events' | 'journal';
  
  leadFilters: { status: LeadStatus[], type: string[] };
  onLeadFilterChange: (filterName: string, value: string[]) => void;
  onClearLeadFilters: () => void;
  leadTypeOptions: { value: string, label: string }[];
  leadStatusOptions: { value: string, label: string }[];

  eventFilters: { type: MarketingEventType[], status: InServiceStatus[] };
  onEventFilterChange: (filterName: string, value: string[]) => void;
  onClearEventFilters: () => void;
  eventStatusOptions: { value: string, label: string }[];

  onHeightChange: (height: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onScheduleEvent: () => void;
  tabsHeight: number;
}

const MarketingFilterBar: React.FC<MarketingFilterBarProps> = (props) => {
  const { activeView, onHeightChange, scrollContainerRef, tabsHeight } = props;
  const barRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        onHeightChange(entries[0].contentRect.height);
      }
    });
    const currentRef = barRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [onHeightChange]);
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleScroll = () => {
      if (container) {
        setIsScrolled(container.scrollTop > 20);
      }
    };
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const isCollapsed = isMobile || isScrolled;

  const activeLeadFilterCount = props.leadFilters.status.length + props.leadFilters.type.length;
  const activeEventFilterCount = props.eventFilters.status.length + props.eventFilters.type.length;
  const activeFilterCount = activeView === 'leads' ? activeLeadFilterCount : activeEventFilterCount;

  const renderExpandedFilters = () => {
    if (activeView === 'leads') {
      return (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <MultiSelect label="Status" options={props.leadStatusOptions} selected={props.leadFilters.status} onChange={(s) => props.onLeadFilterChange('status', s as LeadStatus[])} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <MultiSelect label="Type" options={props.leadTypeOptions} selected={props.leadFilters.type} onChange={(s) => props.onLeadFilterChange('type', s)} />
          </div>
          {activeLeadFilterCount > 0 && <div className="md:ml-auto"><Button variant="ghost" size="sm" onClick={props.onClearLeadFilters}><X className="h-4 w-4 mr-1" />Clear</Button></div>}
        </div>
      );
    }
    if (activeView === 'events') {
      return (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <MultiSelect label="Event Type" options={marketingEventTypeOptions} selected={props.eventFilters.type} onChange={(s) => props.onEventFilterChange('type', s as MarketingEventType[])} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <MultiSelect label="Status" options={props.eventStatusOptions} selected={props.eventFilters.status} onChange={(s) => props.onEventFilterChange('status', s as InServiceStatus[])} />
          </div>
          {activeEventFilterCount > 0 && <div className="md:ml-auto"><Button variant="ghost" size="sm" onClick={props.onClearEventFilters}><X className="h-4 w-4 mr-1" />Clear</Button></div>}
          <div className="ml-auto">
            <Button onClick={() => props.onScheduleEvent()}><Plus className="h-4 w-4 mr-2" />Schedule Event</Button>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCollapsedPill = () => (
    <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && <span className="ml-2 bg-accent text-white h-5 w-5 text-xs flex items-center justify-center rounded-full">{activeFilterCount}</span>}
        </Button>
        {activeView === 'events' && (
             <Button onClick={() => props.onScheduleEvent()}><Plus className="h-4 w-4 mr-2" />Schedule Event</Button>
        )}
    </div>
  );

  if (activeView === 'journal') {
    return <div ref={barRef} />;
  }

  const topOffset = isMobile ? tabsHeight : 0;

  return (
    <>
      <div
        ref={barRef}
        className="sticky bg-surface/80 dark:bg-zinc-900/80 backdrop-blur-lg z-20 p-3 border-b border-border-color"
        style={{ top: `${topOffset}px` }}
      >
        <motion.div
          animate={isCollapsed ? 'collapsed' : 'expanded'}
          variants={{
            expanded: { opacity: 1, height: 'auto' },
            collapsed: { opacity: 1, height: 'auto' },
          }}
          transition={{ duration: 0.2 }}
        >
          {isCollapsed ? renderCollapsedPill() : renderExpandedFilters()}
        </motion.div>
      </div>
      <MarketingFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        {...props}
      />
    </>
  );
};

export default MarketingFilterBar;
