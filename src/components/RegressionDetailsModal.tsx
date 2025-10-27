import React from 'react';
import { Link } from 'react-router-dom';
import SlideOver from './ui/SlideOver';
import type { Order } from '../lib/types';
import EmptyState from './ui/EmptyState';
import { GitPullRequestArrow } from 'lucide-react';

interface RegressionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

const RegressionDetailsModal: React.FC<RegressionDetailsModalProps> = ({ isOpen, onClose, orders }) => {
  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Stage Regression Details">
      <div className="flex h-full flex-col">
        <div className="p-4 border-b border-border-color">
          <p className="text-sm text-muted">
            Showing all patients whose referrals have moved backward in the workflow.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {orders.length === 0 ? (
            <EmptyState 
              Icon={GitPullRequestArrow}
              title="No Regressions Found"
              message="No active referrals have moved to a previous stage recently."
            />
          ) : (
            <ul className="space-y-2">
              {orders.map(order => (
                <li key={order.id}>
                  <Link 
                    to={`/referrals?openPatientId=${order.patient_id}`}
                    onClick={onClose}
                    className="block p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <p className="font-semibold text-text">{order.patients?.name}</p>
                    <p className="text-sm text-muted">{order.workflow_stage}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SlideOver>
  );
};

export default RegressionDetailsModal;
