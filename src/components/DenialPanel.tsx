import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useDenialModal } from '@/state/useDenialModal';
import type { Denial } from '@/lib/types';
import { Button } from './ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import EmptyState from './ui/EmptyState';
import { toast } from '@/lib/toast';
import SimpleConfirmationModal from './ui/SimpleConfirmationModal';
import { writeAuditLog } from '@/lib/auditLogger';

interface DenialPanelProps {
  orderId: string;
  patientId: string;
}

const DenialPanel: React.FC<DenialPanelProps> = ({ orderId, patientId }) => {
  const openModal = useDenialModal(state => state.openModal);
  const queryClient = useQueryClient();
  const [showStoplightPrompt, setShowStoplightPrompt] = useState(false);
  const denialCountRef = useRef(0);

  const { data: denials = [], isLoading } = useQuery<Denial[]>({
    queryKey: ['denials', orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from('denials').select('*').eq('order_id', orderId).order('denial_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    const newCount = denials.length;
    if (newCount > 0 && newCount > denialCountRef.current) {
      setShowStoplightPrompt(true);
    }
    denialCountRef.current = newCount;
  }, [denials]);

  const updateStoplightStatus = useMutation({
      mutationFn: async (status: 'yellow' | 'red') => {
          const updates = [
              supabase.from('orders').update({ stoplight_status: status }).eq('id', orderId),
              supabase.from('patients').update({ stoplight_status: status }).eq('id', patientId)
          ];
          const results = await Promise.all(updates);
          results.forEach(res => { if (res.error) throw res.error; });
          return status;
      },
      onSuccess: (status) => {
          toast(`Stoplight status updated to ${status}.`, 'ok');
          writeAuditLog('stoplight_update', { patient_id: patientId, details: { to: status, reason: 'Denial Logged' } });
          queryClient.invalidateQueries({ queryKey: ['patient_details', patientId] });
          queryClient.invalidateQueries({ queryKey: ['referrals_direct_all'] });
      },
      onError: (error: any) => {
          toast(`Failed to update status: ${error.message}`, 'err');
      }
  });

  const handleDelete = async (id: string) => {
      if (window.confirm('Are you sure you want to delete this denial record?')) {
          const { error } = await supabase.from('denials').delete().eq('id', id);
          if (error) {
              toast(`Error: ${error.message}`, 'err');
          } else {
              toast('Denial record deleted.', 'ok');
              queryClient.invalidateQueries({ queryKey: ['denials', orderId] });
          }
      }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openModal(orderId)}>
          <Plus className="h-4 w-4 mr-2" />
          Log denial
        </Button>
      </div>
      {isLoading ? (
        <div className="text-center p-4">Loading...</div>
      ) : denials.length === 0 ? (
        <EmptyState title="No denials on record." message="Use the 'Log denial' button to add a new record." />
      ) : (
        <ul className="space-y-3">
          {denials.map(denial => (
            <li key={denial.id} className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-text">{denial.reason_text}</p>
                  <p className="text-sm text-muted">{new Date(denial.denial_date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openModal(orderId, denial)} aria-label="Edit denial record"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(denial.id)} aria-label="Delete denial record"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              {denial.notes && <p className="text-sm text-muted mt-2 pt-2 border-t dark:border-zinc-700">{denial.notes}</p>}
              {denial.appeal_filed && (
                <div className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                  Appeal filed on {denial.appeal_date ? new Date(denial.appeal_date).toLocaleDateString() : 'N/A'}, outcome: {denial.appeal_outcome}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <SimpleConfirmationModal
        isOpen={showStoplightPrompt}
        onClose={() => setShowStoplightPrompt(false)}
        onConfirm={() => {
            updateStoplightStatus.mutate('red');
            setShowStoplightPrompt(false);
        }}
        isLoading={updateStoplightStatus.isPending}
        title="Update Referral Status?"
        message="A denial has been logged for this referral. It's recommended to update its status to Yellow or Red."
        confirmButtonText="Set to Red"
        confirmButtonVariant="danger"
      >
          <Button variant="outline" onClick={() => {
              updateStoplightStatus.mutate('yellow');
              setShowStoplightPrompt(false);
          }}>Set to Yellow</Button>
      </SimpleConfirmationModal>
    </div>
  );
};

export default DenialPanel;
