import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SlideOver from './ui/SlideOver';
import type { Order } from '../lib/types';
import { cn } from '../lib/utils';
import { FileCheck, FileWarning } from 'lucide-react';
import EmptyState from './ui/EmptyState';

interface ComplianceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView: 'complete' | 'missing';
  orders: Order[];
}

const TabButton: React.FC<{ name: string; count: number; isActive: boolean; onClick: () => void }> = ({ name, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            'flex-1 whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm focus-ring rounded-t-md flex items-center justify-center gap-2',
            isActive ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text hover:border-gray-300 dark:hover:border-gray-600'
        )}
    >
        {name} <span className={cn('px-2 py-0.5 rounded-full text-xs', isActive ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-zinc-700 text-muted')}>{count}</span>
    </button>
);

const ComplianceDetailsModal: React.FC<ComplianceDetailsModalProps> = ({ isOpen, onClose, initialView, orders }) => {
    const [activeTab, setActiveTab] = useState(initialView);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialView);
        }
    }, [isOpen, initialView]);

    const { completeOrders, missingOrders } = useMemo(() => {
        const complete: Order[] = [];
        const missing: Order[] = [];

        orders.forEach(order => {
            const required = order.patients?.required_documents || [];
            if (required.length > 0) {
                const isComplete = required.every(doc => order.document_status?.[doc] === 'Complete');
                if (isComplete) {
                    complete.push(order);
                } else {
                    missing.push(order);
                }
            } else {
                // If no docs are required, consider it complete
                complete.push(order);
            }
        });
        return { completeOrders: complete, missingOrders: missing };
    }, [orders]);
    
    const displayedOrders = activeTab === 'complete' ? completeOrders : missingOrders;

    return (
        <SlideOver isOpen={isOpen} onClose={onClose} title="Compliance Details">
            <div className="flex h-full flex-col">
                <div className="px-4 border-b border-border-color">
                    <nav className="flex space-x-2" aria-label="Tabs">
                        <TabButton name="Docs Complete" count={completeOrders.length} isActive={activeTab === 'complete'} onClick={() => setActiveTab('complete')} />
                        <TabButton name="Missing Docs" count={missingOrders.length} isActive={activeTab === 'missing'} onClick={() => setActiveTab('missing')} />
                    </nav>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {displayedOrders.length === 0 ? (
                        <EmptyState 
                            Icon={activeTab === 'complete' ? FileCheck : FileWarning}
                            title={activeTab === 'complete' ? "No Referrals with Complete Docs" : "No Referrals with Missing Docs"}
                            message={activeTab === 'complete' ? "All active referrals have pending documentation." : "Great job! All active referrals have complete documentation."}
                        />
                    ) : (
                        <ul className="space-y-2">
                            {displayedOrders.map(order => (
                                <li key={order.id}>
                                    <Link 
                                        to={`/referrals?openPatientId=${order.patient_id}`}
                                        onClick={onClose}
                                        className="block p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <p className="font-semibold text-text">{order.patients?.name}</p>
                                        <p className="text-sm text-muted">{order.patients?.primary_insurance}</p>
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

export default ComplianceDetailsModal;
