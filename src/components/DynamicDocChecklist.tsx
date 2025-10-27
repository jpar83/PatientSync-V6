import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Order, DocumentTemplate } from '../lib/types';
import { Check, X, Loader2 } from 'lucide-react';
import { writeAuditLog } from '../lib/auditLogger';
import { useAuth } from '../contexts/AuthContext';

interface DynamicDocChecklistProps {
  order: Order;
  onUpdate: () => void;
}

const DynamicDocChecklist: React.FC<DynamicDocChecklistProps> = ({ order, onUpdate }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['document_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_templates').select('name, abbrev');
      if (error) throw error;
      return data as Pick<DocumentTemplate, 'name' | 'abbrev'>[];
    },
    staleTime: Infinity, // Templates are static, no need to refetch
  });

  const templateMap = useMemo(() => {
    if (!templates) return new Map<string, string>();
    return new Map(templates.map(t => [t.abbrev, t.name]));
  }, [templates]);

  const mutation = useMutation({
    mutationFn: async ({ docAbbrev, newStatus }: { docAbbrev: string; newStatus: 'Complete' | 'Missing' }) => {
      const currentStatus = order.document_status || {};
      const updatedStatus = { ...currentStatus, [docAbbrev]: newStatus };
      const { error } = await supabase.from('orders').update({ document_status: updatedStatus }).eq('id', order.id);
      if (error) throw error;
      return { docAbbrev, newStatus };
    },
    onSuccess: ({ docAbbrev, newStatus }) => {
      writeAuditLog('doc_status_change', {
        changed_by: user?.email,
        changed_user: order.patients?.name || order.patient_name,
        details: { document: docAbbrev, status: newStatus }
      });
      onUpdate();
    },
    onError: (error) => {
      console.error("Error updating document status:", error);
    }
  });

  const toggleStatus = (docAbbrev: string) => {
    const current = order.document_status?.[docAbbrev] || 'Missing';
    const next = current === 'Complete' ? 'Missing' : 'Complete';
    mutation.mutate({ docAbbrev, newStatus: next });
  };

  const requiredDocs = order.patients?.required_documents || [];

  if (isLoadingTemplates) {
    return <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>;
  }

  if (requiredDocs.length === 0) {
    return <div className="p-4 text-center text-sm text-gray-500">No documents have been marked as required for this patient.</div>;
  }

  return (
    <div className="bg-gray-50 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Required Documents</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requiredDocs.map((abbrev) => {
          const status = order.document_status?.[abbrev] || 'Missing';
          const isComplete = status === 'Complete';
          return (
            <button
              key={abbrev}
              onClick={() => toggleStatus(abbrev)}
              disabled={mutation.isPending}
              className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${
                isComplete
                  ? "bg-green-50 border-green-300 text-green-800 hover:bg-green-100"
                  : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
              }`}
            >
              <span>{templateMap.get(abbrev) || abbrev}</span>
              {isComplete ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
      <div className="text-xs text-gray-500 mt-3">
        Click any document to toggle its status between "Complete" (✅) and "Missing" (❌).
      </div>
    </div>
  );
};

export default DynamicDocChecklist;
