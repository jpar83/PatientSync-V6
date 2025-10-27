import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { writeAuditLog } from '../lib/auditLogger';
import { toast } from "../lib/toast";
import { labelMap, DocKey } from "../lib/docMapping";
import type { Patient, Order } from '../lib/types';
import workflowData from '../../schemas/workflow.json';

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

interface StageRequirementsChecklistProps {
  patient: Patient;
  order: Order;
}

const StageRequirementsChecklist: React.FC<StageRequirementsChecklistProps> = ({ patient, order }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const stageConfig = workflowData.workflow.find(s => s.stage === order.workflow_stage);
  const requiredDocsForStage = stageConfig?.required_docs || [];
  
  const relevantDocs = (patient.required_documents as DocKey[] || []).filter(docKey =>
    requiredDocsForStage.includes(docKey)
  );

  const mutation = useMutation({
    mutationFn: async ({ key, nextStatus }: { key: string; nextStatus: DocStatus }) => {
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
    const currentStatus = order.document_status?.[key] === 'Complete' ? 'complete' : 'missing';
    const nextStatus: DocStatus = currentStatus === "complete" ? "missing" : "complete";

    const undo = () => {
      mutation.mutate({ key, nextStatus: currentStatus });
    };

    try {
      await mutation.mutateAsync({ key, nextStatus });
      toast(`${labelMap[key as DocKey] || key} marked ${nextStatus}.`, 'ok', { label: "Undo", onClick: undo });
    } catch {
      toast("Update failed", "err");
    }
  };

  if (relevantDocs.length === 0) {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50">
            <div className="w-full flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Stage Requirements</span>
            </div>
            <p className="px-4 pb-4 text-sm text-center text-muted">No specific documents are required for this stage.</p>
        </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50">
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={() => setIsOpen(v => !v)}
      >
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Stage Requirements</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
            <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2">
              {relevantDocs.map((key) => (
                <DocRow
                  key={key}
                  label={labelMap[key as DocKey] || key}
                  value={order.document_status?.[key] === 'Complete' ? 'complete' : 'missing'}
                  onToggle={toggle(key)}
                  isToggling={mutation.isPending && mutation.variables?.key === key}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StageRequirementsChecklist;
