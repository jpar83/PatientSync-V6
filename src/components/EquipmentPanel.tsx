import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useEquipmentModal } from '@/state/useEquipmentModal';
import type { Equipment } from '@/lib/types';
import { Button } from './ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import EmptyState from './ui/EmptyState';
import { toast } from '@/lib/toast';

interface EquipmentPanelProps {
  orderId: string;
}

const EquipmentPanel: React.FC<EquipmentPanelProps> = ({ orderId }) => {
  const openModal = useEquipmentModal(state => state.openModal);
  
  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ['equipment', orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment').select('*').eq('order_id', orderId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const handleDelete = async (id: string) => {
      if (window.confirm('Are you sure you want to delete this equipment record?')) {
          const { error } = await supabase.from('equipment').delete().eq('id', id);
          if (error) {
              toast(`Error: ${error.message}`, 'err');
          } else {
              toast('Equipment record deleted.', 'ok');
              // The query will be invalidated by the modal, but we can do it here too for direct action
          }
      }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openModal(orderId)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>
      {isLoading ? (
        <div className="text-center p-4">Loading...</div>
      ) : equipment.length === 0 ? (
        <EmptyState title="No Equipment Logged" message="Add equipment records for this order." />
      ) : (
        <ul className="space-y-3">
          {equipment.map(item => (
            <li key={item.id} className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-text">{item.equipment_type}</p>
                  <p className="text-sm text-muted">{item.model || 'No model'} - S/N: {item.serial_number || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openModal(orderId, item)} aria-label="Edit equipment record"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(item.id)} aria-label="Delete equipment record"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                Status: {item.status} {item.date_delivered ? `(Delivered: ${new Date(item.date_delivered).toLocaleDateString()})` : ''}
              </div>
              {(item.is_returned || item.is_repaired) && (
                <div className="text-xs mt-1 text-amber-600 dark:text-amber-400">
                  {item.is_returned && `Returned: ${item.date_returned ? new Date(item.date_returned).toLocaleDateString() : 'Yes'}`}
                  {item.is_returned && item.is_repaired && ' | '}
                  {item.is_repaired && `Repaired: ${item.date_repaired ? new Date(item.date_repaired).toLocaleDateString() : 'Yes'}`}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EquipmentPanel;
