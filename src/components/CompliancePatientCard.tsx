import React from 'react';
import type { Order } from '../lib/types';

interface CompliancePatientCardProps {
  order: Order;
}

const CompliancePatientCard: React.FC<CompliancePatientCardProps> = ({ order }) => {
    const required = order.patients?.required_documents || [];
    const completedCount = required.filter(d => order.document_status?.[d] === 'Complete').length;
    const progress = required.length > 0 ? Math.round((completedCount / required.length) * 100) : 100;

    let progressBarColor = 'bg-amber-400';
    if (progress === 100) {
        progressBarColor = 'bg-teal-500';
    } else if (progress === 0 && required.length > 0) {
        progressBarColor = 'bg-rose-500';
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{order.patients?.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{order.patients?.primary_insurance}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                    progress === 100 ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-600'
                }`}>
                    {progress}%
                </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${progressBarColor}`} style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};

export default CompliancePatientCard;
