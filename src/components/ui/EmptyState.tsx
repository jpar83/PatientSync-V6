import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  Icon?: React.ElementType;
  title: string;
  message: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ Icon = Inbox, title, message, children }) => {
  return (
    <div className="text-center py-12 px-6 bg-gray-50 dark:bg-surface rounded-lg">
      <Icon className="mx-auto h-10 w-10 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1 text-sm text-muted">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default EmptyState;
