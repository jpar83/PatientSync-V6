import React from 'react';
import { Link } from 'react-router-dom';
import SlideOver from './ui/SlideOver';
import type { DenialSummary } from '../lib/types';
import EmptyState from './ui/EmptyState';
import { ShieldX } from 'lucide-react';

interface DenialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  denialData: DenialSummary[];
}

const DenialDetailsModal: React.FC<DenialDetailsModalProps> = ({ isOpen, onClose, denialData }) => {
  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Denial Details">
      <div className="flex h-full flex-col">
        <div className="p-4 border-b border-border-color">
          <p className="text-sm text-muted">
            Showing all patients with at least one denial record.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {denialData.length === 0 ? (
            <EmptyState 
              Icon={ShieldX}
              title="No Denials Found"
              message="There are currently no denial records for any active patients."
            />
          ) : (
            <ul className="space-y-2">
              {denialData.map(item => (
                <li key={item.patient_id}>
                  <Link 
                    to={`/referrals?openPatientId=${item.patient_id}`}
                    onClick={onClose}
                    className="block p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-text">{item.patient_name}</p>
                        <span className="text-sm font-bold text-red-500">{item.denial_count}</span>
                    </div>
                    <p className="text-xs text-muted">Denial(s) on record</p>
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

export default DenialDetailsModal;
