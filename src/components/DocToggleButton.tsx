import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Check, X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { writeAuditLog } from '../lib/auditLogger';
import { cn } from '../lib/utils';

interface DocToggleButtonProps {
  orderId: string;
  patientName: string;
  docAbbrev: string;
  initialStatus: 'Complete' | 'Missing' | 'Pending' | undefined;
}

export function DocToggleButton({ orderId, patientName, docAbbrev, initialStatus }: DocToggleButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(initialStatus || 'Missing');

  const mutation = useMutation({
    mutationFn: async (newStatus: 'Complete' | 'Missing') => {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('document_status')
        .eq('id', orderId)
        .single();
      
      if (fetchError) throw fetchError;

      const currentDocStatus = data.document_status || {};
      const updatedDocStatus = { ...currentDocStatus, [docAbbrev]: newStatus };

      const { error } = await supabase
        .from('orders')
        .update({ document_status: updatedDocStatus })
        .eq('id', orderId);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['compliance_orders'] });
      queryClient.invalidateQueries({ queryKey: ['referrals_direct_all'] });
      
      writeAuditLog('doc_status_change', {
        changed_by: user?.email,
        changed_user: patientName,
        details: { document: docAbbrev, status: newStatus }
      });
    },
    onError: (error) => {
      console.error("Error updating document status:", error);
      setStatus(initialStatus || 'Missing');
    }
  });

  const toggleStatus = () => {
    const newStatus = status === "Complete" ? "Missing" : "Complete";
    setStatus(newStatus);
    mutation.mutate(newStatus);
  };

  if (mutation.isPending) {
    return <div className="flex items-center justify-center w-6 h-6"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  }

  return (
    <button
      onClick={toggleStatus}
      className={cn(
        'flex items-center justify-center w-6 h-6 rounded-full mx-auto hover:opacity-80 transition',
        status === "Complete" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
      )}
      title={status === "Complete" ? "Mark as Missing" : "Mark as Complete"}
      aria-label={status === "Complete" ? `Mark document ${docAbbrev} as Missing` : `Mark document ${docAbbrev} as Complete`}
    >
      {status === "Complete" ? <Check size={16} /> : <X size={16} />}
    </button>
  );
}
