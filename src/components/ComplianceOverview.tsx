import React, { useMemo } from 'react';
import type { Order } from '../lib/types';

interface Props {
    orders: Order[];
}

const ComplianceOverview: React.FC<Props> = ({ orders }) => {
    const { readyForParCount, avgCompletion } = useMemo(() => {
        let totalDocs = 0;
        let completedDocs = 0;

        orders.forEach(order => {
            const required = order.patients?.required_documents || [];
            if (required.length > 0) {
                totalDocs += required.length;
                const completed = required.filter(doc => order.document_status?.[doc] === 'Complete').length;
                completedDocs += completed;
            }
        });
        
        const readyCount = orders.filter(o => {
            const req = o.patients?.required_documents || [];
            return req.length > 0 && req.every(d => o.document_status?.[d] === 'Complete');
        }).length;

        return {
            readyForParCount: readyCount,
            avgCompletion: totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0,
        };
    }, [orders]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 text-center">
                <div className="text-sm font-medium text-muted">Ready for PAR</div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-1">{readyForParCount}</div>
            </div>
             <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 text-center">
                <div className="text-sm font-medium text-muted">Avg. Doc Completion</div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-1">{avgCompletion}%</div>
            </div>
        </div>
    );
};

export default ComplianceOverview;
