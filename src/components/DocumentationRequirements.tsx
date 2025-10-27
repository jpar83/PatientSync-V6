import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { writeAuditLog } from '../lib/auditLogger';
import { toast } from "../lib/toast";
import { labelMap } from "../lib/docMapping";
import type { Patient, Order } from '../lib/types';

type DocStatus = "missing" | "complete";

const DocRow = ({
  label, value, onToggle, isToggling,
}: { label: string; value: DocStatus; onToggle: () => void; isToggling: boolean }) => {
  const isComplete = value === "complete";
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      disabled={isToggling}
      className="w-full py-3 flex items-center justify-between text-left border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 focus:outline-none focus-ring rounded-md"
      aria-pressed={isComplete}
    >
      <span className="text-[15px] text-zinc-800 dark:text-zinc-200">{label}</span>
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : (
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            isComplete ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
          ].join(" ")}
        >
          {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {isComplete ? "Complete" : "Missing"}
        </span>
      )}
    </motion.button>
  );
}

export default function DocumentationRequirements({
  patient, order
}: { patient: Patient; order: Order | null }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [docs, setDocs] = useState<Record<string, DocStatus>>({});

  const requiredDocKeys = useMemo(() => patient.required_documents || [], [patient.required_documents]);

  useEffect(() => {
    const initialStatuses: Record<string, DocStatus> = {};
    requiredDocKeys.forEach(key => {
      const status = order?.document_status?.[key];
      initialStatuses[key] = status === 'Complete' ? 'complete' : 'missing';
    });
    setDocs(initialStatuses);
  }, [order, requiredDocKeys]);

  const mutation = useMutation({
    mutationFn: async ({ key, nextStatus }: { key: string; nextStatus: DocStatus }) => {
      if (!order) throw new Error("No order context available");
      const currentStatus = order.document_status || {};
      const updatedStatus = { ...currentStatus, [key]: nextStatus === 'complete' ? 'Complete' : 'Missing' };
      const { error } = await supabase.from('orders').update({ document_status: updatedStatus }).eq('id', order.id);
      if (error) throw error;
      return { key, nextStatus };
    },
    onSuccess: ({ key, nextStatus }) => {
      writeAuditLog('doc_status_change', {
        changed_by: user?.email,
        changed_user: patient.name,
        details: { document: key, status: nextStatus }
      });
      queryClient.invalidateQueries({ queryKey: ['patient_details', patient.id] });
      queryClient.invalidateQueries({ queryKey: ['referrals_direct_all'] });
      queryClient.invalidateQueries({ queryKey: ['compliance_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
      queryClient.invalidateQueries({ queryKey: ['account_overview'] });
    },
  });

  const toggle = (key: string) => async () => {
    const prevStatus = docs[key];
    const nextStatus: DocStatus = prevStatus === "complete" ? "missing" : "complete";

    // Optimistic update
    setDocs((d) => ({ ...d, [key]: nextStatus }));

    const undo = () => {
      setDocs((d) => ({ ...d, [key]: prevStatus }));
      mutation.mutate({ key, nextStatus: prevStatus });
    };

    try {
      await mutation.mutateAsync({ key, nextStatus });
      toast(`${labelMap[key] || key} marked ${nextStatus}.`, 'ok', { label: "Undo", onClick: undo });
    } catch {
      undo(); // Revert on failure
      toast("Update failed", "err");
    }
  };
  
  if (requiredDocKeys.length === 0) {
    return <p className="text-sm text-center text-muted py-4">No documents are required for this patient.</p>;
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50">
      <div className="px-4 pt-3 pb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Documentation Requirements
      </div>
      <div className="px-2">
        {requiredDocKeys.map((key) => (
          <DocRow
            key={key}
            label={labelMap[key] || key}
            value={docs[key] as DocStatus}
            onToggle={toggle(key)}
            isToggling={mutation.isPending && mutation.variables?.key === key}
          />
        ))}
      </div>
    </div>
  );
}
