import React, { useMemo } from 'react';
import { Loader2, Edit, Archive } from 'lucide-react';
import { Btn } from './ui/Btn';
import type { Order } from '../lib/types';
import { highlight } from '../lib/highlight';
import { Checkbox } from './ui/Checkbox';

interface ReferralTableProps {
  orders: Order[];
  isLoading: boolean;
  onStageChangeClick: (order: Order) => void;
  onPatientClick: (order: Order) => void;
  onArchiveToggle: (order: Order) => void;
  term: string;
  selectedOrderIds: string[];
  onToggleSelection: (orderId: string) => void;
}

const ReferralTable: React.FC<ReferralTableProps> = ({ orders = [], isLoading, onStageChangeClick, onPatientClick, onArchiveToggle, term, selectedOrderIds, onToggleSelection }) => {
  
  const groupedOrders = useMemo(() => {
    return orders.reduce((acc, order) => {
        const patientName = order.patients?.name || '';
        const firstLetter = patientName?.[0]?.toUpperCase();
        if (firstLetter && /^[A-Z]$/.test(firstLetter)) {
            if (!acc[firstLetter]) acc[firstLetter] = [];
            acc[firstLetter].push(order);
        } else {
            if (!acc['#']) acc['#'] = [];
            acc['#'].push(order);
        }
        return acc;
    }, {} as Record<string, Order[]>);
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full soft-card">
      <table className="min-w-full w-full text-sm table-compact">
        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs sticky top-0 z-20">
          <tr>
            <th className="p-2 w-12 text-center">
              {/* Select All Checkbox removed from here */}
            </th>
            <th className="text-left">Patient</th>
            <th className="text-left">Insurance</th>
            <th className="text-left">Stage</th>
            <th className="text-left">Last Update</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-border-color">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 px-6 text-gray-500">
                <p className="font-semibold">No Referrals Found</p>
                <p className="text-sm mt-1">No records match the current filters.</p>
              </td>
            </tr>
          ) : (
            Object.keys(groupedOrders).sort().map(letter => (
              <React.Fragment key={letter}>
                <tr className="sticky top-[34px] z-10">
                  <td colSpan={6} className="bg-gray-100 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-1 font-bold text-sm uppercase text-muted">
                    {letter}
                  </td>
                </tr>
                {groupedOrders[letter].map((order) => (
                  <tr key={order.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20 transition-colors">
                    <td className="text-center">
                      <Checkbox
                        label=""
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => onToggleSelection(order.id)}
                      />
                    </td>
                    <td className="font-medium">
                      <button
                        onClick={() => onPatientClick(order)}
                        className="text-teal-600 dark:text-teal-400 hover:underline text-left focus-ring rounded"
                        dangerouslySetInnerHTML={{ __html: highlight(order.patients?.name || order.patient_name || 'Unknown', term) }}
                      />
                    </td>
                    <td className="text-gray-500 dark:text-gray-400">{order.patients?.primary_insurance || 'N/A'}</td>
                    <td className="text-gray-500 dark:text-gray-400">{order.workflow_stage}</td>
                    <td className="text-gray-500 dark:text-gray-400">{order.last_stage_change ? new Date(order.last_stage_change).toLocaleDateString() : 'N/A'}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Btn variant="outline" size="sm" onClick={() => onStageChangeClick(order)}>
                          <Edit className="h-3 w-3 mr-1" /> Change
                        </Btn>
                        <Btn variant="outline" size="sm" onClick={() => onArchiveToggle(order)}>
                          <Archive className="h-3 w-3 mr-1" /> Archive
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReferralTable;
