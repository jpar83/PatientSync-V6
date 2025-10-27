import React, { useState, useRef, createContext, useContext, useLayoutEffect } from 'react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface DropdownMenuContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  parentRef: React.RefObject<HTMLDivElement>;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

const useDropdownMenu = () => {
    const context = useContext(DropdownMenuContext);
    if (!context) {
        throw new Error('useDropdownMenu must be used within a DropdownMenu');
    }
    return context;
};

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, parentRef }}>
      <div className="relative inline-block text-left" ref={parentRef}>{children}</div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => {
  const { setIsOpen } = useDropdownMenu();
  const handleClick = () => setIsOpen(prev => !prev);

  if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
          ...children.props,
          onClick: (e: React.MouseEvent) => {
              handleClick();
              if (children.props.onClick) {
                  children.props.onClick(e);
              }
          },
      });
  }
  return <div onClick={handleClick}>{children}</div>;
};

const DropdownMenuContent = ({ children, align = 'start', side = 'bottom', className }: { children: React.ReactNode; align?: 'start' | 'end'; side?: 'top' | 'bottom'; className?: string }) => {
  const { isOpen, setIsOpen, parentRef } = useDropdownMenu();
  const contentRef = useRef<HTMLDivElement>(null);
  const [finalAlign, setFinalAlign] = useState(align);
  useOnClickOutside(contentRef, () => setIsOpen(false));

  useLayoutEffect(() => {
    if (isOpen && parentRef.current && contentRef.current) {
        const parentRect = parentRef.current.getBoundingClientRect();
        const contentWidth = contentRef.current.offsetWidth;
        const windowWidth = window.innerWidth;
        const buffer = 16; // 1rem buffer from viewport edge

        // If default alignment is 'start' but it would overflow right, flip to 'end'
        if (align === 'start' && parentRect.left + contentWidth > windowWidth - buffer) {
            setFinalAlign('end');
        } 
        // If default alignment is 'end' but it would overflow left, flip to 'start'
        else if (align === 'end' && parentRect.right - contentWidth < buffer) {
            setFinalAlign('start');
        } 
        // Otherwise, stick to the intended alignment
        else {
            setFinalAlign(align);
        }
    }
  }, [isOpen, align, parentRef]);

  const alignClasses = {
    start: 'left-0',
    end: 'right-0',
  };

  const sideClasses = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
  };
  
  const originClass = side === 'top' ? (finalAlign === 'start' ? 'origin-bottom-left' : 'origin-bottom-right') : (finalAlign === 'start' ? 'origin-top-left' : 'origin-top-right');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          className={cn(
            'absolute z-50 w-56 rounded-xl shadow-xl bg-surface dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none',
            alignClasses[finalAlign],
            sideClasses[side],
            originClass,
            className
          )}
        >
          <div className="p-1.5" role="menu" aria-orientation="vertical">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DropdownMenuItem = ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => {
  const { setIsOpen } = useDropdownMenu();
  const handleClick = () => {
    if (onClick) onClick();
    setIsOpen(false);
  };
  return (
    <button
      onClick={handleClick}
      className={cn("w-full text-left flex items-center px-2 py-1.5 text-sm text-text rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800", className)}
      role="menuitem"
    >
      {children}
    </button>
  );
};

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
