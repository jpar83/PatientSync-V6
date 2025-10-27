import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { printWeeklyReport } from '../lib/printReport';
import { getLogoDataUrl } from '../lib/utils';
import { Btn } from '../components/ui/Btn';
import { Printer, Loader2 } from 'lucide-react';
import type { Order } from '../lib/types';
import TableSkeleton from '../components/ui/TableSkeleton';

const Reports: React.FC = () => {
    const [isPrinting, setIsPrinting] = useState(false);

    const { data: orders, isLoading } = useQuery<Order[], Error>({
        queryKey: ['allOrdersForReport'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*, patients(*), vendors(name)');
            if (error) throw new Error(error.message);
            return data as Order[];
        },
    });

    const handlePrint = async () => {
        if (!orders) return;
        setIsPrinting(true);
        try {
            const activeOrders = orders.filter(o => !o.is_archived);
            const metrics = {
                total: activeOrders.length,
                ready: activeOrders.filter(o => {
                    const required = o.patients?.required_documents || [];
                    if (required.length === 0) return true;
                    return required.every(d => o.document_status?.[d] === 'Complete');
                }).length,
                avgDays: 0, // Simplified for now
                archived: orders.length - activeOrders.length,
            };
            const logoUrl = await getLogoDataUrl();
            printWeeklyReport(activeOrders, metrics, logoUrl);
        } catch (error) {
            console.error("Failed to print weekly report:", error);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 pb-nav-safe">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Reports</h1>

            <div className="soft-card max-w-2xl">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-text">Weekly Summary PDF</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-muted">
                        Generate a PDF summary of all active referrals, including key metrics. This is useful for weekly meetings or sharing progress.
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-black/20 p-4 flex justify-end">
                    <Btn onClick={handlePrint} disabled={isPrinting || isLoading}>
                        {isPrinting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Printer className="h-4 w-4 mr-2" />
                        )}
                        {isPrinting ? 'Generating...' : 'Generate Weekly Report'}
                    </Btn>
                </div>
            </div>

            <div className="soft-card">
                 <div className="p-6 border-b dark:border-border-color">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-text">Active Referrals Preview</h2>
                     <p className="mt-1 text-sm text-gray-500 dark:text-muted">
                        A quick look at the data that will be included in the report.
                    </p>
                </div>
                <div className="table-wrap">
                    <div className="sticky-header">
                        {isLoading ? (
                            <TableSkeleton />
                        ) : (
                            <table className="min-w-full w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="p-3 text-left">Patient</th>
                                        <th className="p-3 text-left">Insurance</th>
                                        <th className="p-3 text-left">Stage</th>
                                        <th className="p-3 text-left">Vendor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-border-color">
                                    {(orders?.filter(o => !o.is_archived).slice(0, 10) || []).map(order => (
                                        <tr key={order.id}>
                                            <td className="p-3 font-medium">{order.patients?.name || 'N/A'}</td>
                                            <td className="p-3 text-muted">{order.patients?.primary_insurance || 'N/A'}</td>
                                            <td className="p-3 text-muted">{order.workflow_stage}</td>
                                            <td className="p-3 text-muted">{order.vendors?.name || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {orders && orders.filter(o => !o.is_archived).length === 0 && !isLoading && (
                            <div className="text-center py-10 text-muted">No active referrals to report.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
