import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ViewPatientDetails from "@/components/ViewPatientDetails";
import EditPatientDetails from "@/components/EditPatientDetails";
import WorkflowHub from "@/components/WorkflowHub";
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../lib/toast';
import type { Patient, Order, WorkflowStage, Denial, Equipment } from '../lib/types';
import { Loader2, Edit, FileText, Activity, Archive, RotateCcw, X, Save } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import StageChangeModal from '../components/StageChangeModal';
import AddNoteModal from '../components/AddNoteModal';
import SimpleConfirmationModal from '../components/ui/SimpleConfirmationModal';
import workflowData from '../../schemas/workflow.json';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUIState } from '@/state/useUIState';
import { isBackward, formatDateForExport } from "../lib/utils";
import { generatePatientSnapshotPDF } from '@/lib/pdfUtils';
import StoplightStatusControl from '../components/StoplightStatusControl';
import { useNoteMutations } from "@/hooks/useNoteMutations";
import { addNote as apiAddNote } from "@/api/notes.api";

const recommendedFields: (keyof Patient)[] = ['name', 'dob', 'pcp_name', 'phone_number', 'address_line1', 'city', 'zip', 'primary_insurance'];

export default function PatientDrawerAdaptive({ patientId, open, onClose, onUpdate, startInEditMode = false }: { patientId: string | null, open: boolean, onClose: () => void, onUpdate: () => void, startInEditMode?: boolean }) {
  const [isEditMode, setIsEditMode] = useState(startInEditMode);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'workflow'>('details');
  const [showStageModal, setShowStageModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const queryClient = useQueryClient();
  const setOverlayVisible = useUIState(state => state.setOverlayVisible);
  const [isExporting, setIsExporting] = useState(false);

  const { addNote } = useNoteMutations(patientId || '', onUpdate);

  useEffect(() => {
    setOverlayVisible(open);
    return () => {
      setOverlayVisible(false);
    };
  }, [open, setOverlayVisible]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient_full_details', patientId],
    queryFn: async () => {
        if (!patientId) return null;

        const { data: patientData, error: patientError } = await supabase.from('patients').select('*').eq('id', patientId).single();
        if (patientError) throw patientError;

        const { data: orderData, error: orderError } = await supabase.from('orders').select('*, vendors(name, email)').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1).single();
        if (orderError && orderError.code !== 'PGRST116') {
            console.warn("Error fetching primary order for patient:", orderError);
        }

        let equipmentData: Equipment[] = [];
        let denialsData: Denial[] = [];

        if (orderData) {
            const [equipmentRes, denialsRes] = await Promise.all([
                supabase.from('equipment').select('*').eq('order_id', orderData.id),
                supabase.from('denials').select('*').eq('order_id', orderData.id),
            ]);
            equipmentData = equipmentRes.data || [];
            denialsData = denialsRes.data || [];
        }

        return {
            patient: patientData as Patient,
            order: orderData as Order | null,
            equipment: equipmentData,
            denials: denialsData,
        };
    },
    enabled: !!patientId && open,
    staleTime: 1000 * 60,
  });

  const patient = data?.patient;
  const order = data?.order;
  const equipment = data?.equipment ?? [];
  const denials = data?.denials ?? [];

  useEffect(() => {
    if (isError) {
        toast('Failed to fetch patient details.', 'err');
        onClose();
    }
  }, [isError, onClose]);

  useEffect(() => {
    if (open) {
      setIsEditMode(startInEditMode);
      setActiveTab(isDesktop ? 'details' : 'workflow');
    } else {
      setIsEditMode(false);
    }
  }, [open, startInEditMode, patientId, isDesktop]);

  const getOrCreateProviderId = async (name: string | null | undefined): Promise<string | null> => {
    if (!name?.trim()) return null;
    const normalizedName = name.trim().toUpperCase();

    const { data: existing } = await supabase
        .from('insurance_providers')
        .select('id')
        .eq('name', normalizedName)
        .single();

    if (existing) return existing.id;

    const { data: created, error: createError } = await supabase
        .from('insurance_providers')
        .insert({ name: normalizedName, source: 'form-edit' })
        .select('id')
        .single();
    
    if (createError) throw createError;
    toast(`New provider "${normalizedName}" added.`, 'ok');
    queryClient.invalidateQueries({ queryKey: ['insurance_providers'] });
    return created.id;
  };

  const handleSave = async (patientData: Partial<Patient>, orderData: Partial<Order>) => {
    if (!patient) return;
    setIsSaving(true);

    const providerId = await getOrCreateProviderId(patientData.primary_insurance);
    
    const patientPayload = { ...patientData, insurance_provider_id: providerId };
    delete patientPayload.id; delete patientPayload.created_at;
    if (patientPayload.dob === '') { patientPayload.dob = null; }

    try {
      const { data: updatedPatient, error: patientUpdateError } = await supabase.from('patients').update(patientPayload).eq('id', patient.id).select().single();
      if (patientUpdateError) throw patientUpdateError;
      
      if(order?.id) {
        const orderPayload = { ...orderData };
        delete orderPayload.id; delete orderPayload.created_at; delete orderPayload.patients; delete orderPayload.vendors;
        const { error: orderUpdateError } = await supabase.from('orders').update(orderPayload).eq('id', order.id);
        if (orderUpdateError) throw orderUpdateError;
      }
      
      await apiAddNote({
        patient_id: patient.id,
        body: 'Patient details updated.',
        source: 'manual',
      });
      
      const missingRecommended = recommendedFields.some(field => !patientData[field]);
      if (missingRecommended) toast('Saved with missing recommended fields.', 'warning');
      else toast('Patient details saved successfully.', 'ok');
      
      onUpdate();
      
      setIsEditMode(false);
    } catch (error: any) {
      console.error("Failed to save patient details:", error);
      if (error.code === '23505') {
          toast('This email address is already in use.', 'err');
      } else {
          toast(`Failed to save patient details.`, 'err');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleStageSave = async ({ newStage, note, regressionReason }: { newStage: WorkflowStage; note: string; regressionReason?: string }) => {
    if (!order || !patient) return;
    
    const isRegression = isBackward(order.workflow_stage, newStage);

    const { error: orderError } = await supabase.from('orders').update({
        workflow_stage: newStage,
        last_stage_note: note,
        last_stage_change: new Date().toISOString()
    }).eq('id', order.id);

    if (orderError) { 
        toast('Failed to update stage.', 'err');
        return;
    }

    await apiAddNote({
      patient_id: patient.id,
      body: note,
      source: 'stage_change',
      stage_from: order.workflow_stage,
      stage_to: newStage,
    });
    
    if (isRegression && regressionReason) {
        await supabase.from('regressions').insert({
            order_id: order.id,
            reason: regressionReason,
            notes: note,
            previous_stage: order.workflow_stage,
            new_stage: newStage,
            user_id: user?.id,
        });
    }

    toast('Stage updated.', 'ok'); 
    onUpdate(); 
    queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
    queryClient.invalidateQueries({ queryKey: ['regression_insights'] });
    setShowStageModal(false);
  };

  const handleAddNoteSave = async (note: string) => {
    addNote.mutate(note);
  };
  
  const handleArchiveConfirm = async () => {
    if (!order) return;
    setIsArchiving(true);
    try {
        const newStatus = !order.is_archived;
        const { error } = await supabase
            .from('orders')
            .update({ is_archived: newStatus })
            .eq('id', order.id);

        if (error) throw error;

        await apiAddNote({
            patient_id: order.patient_id,
            body: `Referral ${newStatus ? 'archived' : 'restored'}.`,
            source: 'manual',
        });
        toast(`Referral ${newStatus ? 'archived' : 'restored'}.`, 'ok');
        onUpdate();
        onClose();
    } catch (error: any) {
        toast(`Failed to update archive status: ${error.message}`, 'err');
    } finally {
        setIsArchiving(false);
        setShowArchiveModal(false);
    }
  };

  const handleExportSnapshot = async () => {
    if (!order || !patient) {
        toast('Patient or order data not available for export.', 'warning');
        return;
    }
    setIsExporting(true);
    toast('Generating snapshot...', 'ok');
    try {
        const { data: auditLog, error: auditError } = await supabase
            .from('audit_log')
            .select('*')
            .contains('details', { patient_id: order.patient_id })
            .order('timestamp', { ascending: false })
            .limit(5);
        if (auditError) throw auditError;

        await generatePatientSnapshotPDF({ order, auditLog: auditLog as any[], denials, user });
        toast('Snapshot PDF generated.', 'ok');
    } catch (error: any) {
        toast(`Failed to generate PDF: ${error.message}`, 'err');
    } finally {
        setIsExporting(false);
    }
  };

  const handleStoplightUpdate = () => {
    onUpdate();
  };

  const referralStartDate = order?.referral_date ? formatDateForExport(order.referral_date, true) : '—';
  const workflowStages = workflowData.workflow.map(w => w.stage) as WorkflowStage[];

  const header = (
    <div
      className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg px-4 pt-3 pb-0 border-b border-black/5 dark:border-white/5"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm uppercase tracking-wide text-muted">Patient Details</div>
          <div className="text-xl font-bold tracking-tight text-text">{patient?.name || 'Loading...'}</div>
          {patient && !isEditMode && (
              <div className="mt-0.5 text-xs text-muted flex flex-wrap items-center gap-x-3">
                  <span>{patient.primary_insurance || 'No Payer'}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>{order?.workflow_stage || 'No Stage'}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="bg-yellow-400 dark:bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-md">
                    Start Date: {referralStartDate}
                  </span>
              </div>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {!isEditMode && !isLoading && patient && order && (
            <StoplightStatusControl orderId={order.id} patientId={patient.id} currentStatus={order.stoplight_status} onUpdate={handleStoplightUpdate} />
          )}
          {!isEditMode && !isLoading && (
            <>
              {order && (
                  <Button size="sm" variant="outline" className="text-sm" onClick={handleExportSnapshot} disabled={isExporting}>
                      {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                      Snapshot
                  </Button>
              )}
              {order && (
                <Button size="sm" variant="outline"
                  className={cn("text-sm", order.is_archived ? "text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-800/50" : "text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-600 dark:bg-amber-900/50 dark:hover:bg-amber-800/50")}
                  onClick={() => setShowArchiveModal(true)}
                >
                  {order.is_archived ? <RotateCcw className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
                  {order.is_archived ? 'Restore' : 'Archive'}
                </Button>
              )}
              <Button size="sm" variant="secondary" className="text-sm" onClick={() => setIsEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
            </>
          )}
          <button onClick={onClose} className="text-muted text-2xl leading-none pb-1" aria-label="Close">
            ×
          </button>
        </div>
      </div>
      {isDesktop && !isEditMode && (
          <div className="mt-2 -mb-px flex space-x-4 px-4">
              <TabButton isActive={activeTab === 'details'} onClick={() => setActiveTab('details')}><FileText className="h-4 w-4 mr-2" />Details</TabButton>
              <TabButton isActive={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')}><Activity className="h-4 w-4 mr-2" />Workflow</TabButton>
          </div>
      )}
    </div>
  );

  const drawerContent = (
      <div className="flex h-full flex-col bg-surface shadow-xl">
        {header}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
          ) : patient ? (
            <div className="p-3 md:p-4 pb-[calc(124px+env(safe-area-inset-bottom))]">
              <AnimatePresence mode="wait">
                {isEditMode ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <EditPatientDetails
                      patient={patient!}
                      order={order}
                      onSave={handleSave}
                      onCancel={() => setIsEditMode(false)}
                      isSaving={isSaving}
                    />
                  </motion.div>
                ) : isDesktop ? (
                  <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {activeTab === 'details' && <ViewPatientDetails patient={patient!} order={order} equipment={equipment} denials={denials} />}
                    {activeTab === 'workflow' && <WorkflowHub order={order} patient={patient!} onStageChangeClick={() => setShowStageModal(true)} onAddNoteClick={() => setShowNoteModal(true)} onUpdate={onUpdate} />}
                  </motion.div>
                ) : (
                  <motion.div key="single-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-4">
                      <WorkflowHub order={order} patient={patient!} onStageChangeClick={() => setShowStageModal(true)} onAddNoteClick={() => setShowNoteModal(true)} onUpdate={onUpdate} />
                      <ViewPatientDetails patient={patient!} order={order} equipment={equipment} denials={denials} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-6 text-center text-muted">Patient not found.</div>
          )}
        </div>
        {isEditMode && (
          <div className="sticky bottom-0 flex-shrink-0 border-t border-border-color p-3 bg-surface/80 backdrop-blur-lg flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditMode(false)} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" form="patient-edit-form" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 w-4 mr-2" />}
              Save Patient
            </Button>
          </div>
        )}
      </div>
  );

  return (
    <>
      <AnimatePresence>
          {open && (
              <div className="fixed inset-0 overflow-hidden z-50" role="dialog" aria-modal="true">
                  <motion.div
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                      aria-hidden="true"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={onClose}
                  ></motion.div>
                  
                  {isDesktop ? (
                      <motion.div
                          className="pointer-events-auto fixed inset-y-0 right-0 w-[78vw] max-w-[1280px]"
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                          {drawerContent}
                      </motion.div>
                  ) : (
                      <motion.div
                          className="fixed inset-x-0 bottom-0 max-h-[95vh] pointer-events-auto"
                          initial={{ y: '100%' }}
                          animate={{ y: 0 }}
                          exit={{ y: '100%' }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                          <div className="rounded-t-2xl overflow-hidden h-full">
                            {drawerContent}
                          </div>
                      </motion.div>
                  )}
              </div>
          )}
      </AnimatePresence>
      {showStageModal && order && <StageChangeModal current={order.workflow_stage as WorkflowStage} stages={workflowStages} onSave={handleStageSave} onClose={() => setShowStageModal(false)} order={order} />}
      {showNoteModal && patient && <AddNoteModal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} onSave={handleAddNoteSave} />}
      <SimpleConfirmationModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleArchiveConfirm}
        isLoading={isArchiving}
        title={order?.is_archived ? 'Restore Referral' : 'Archive Referral'}
        message={`Are you sure you want to ${order?.is_archived ? 'restore' : 'archive'} the referral for ${patient?.name}?`}
        confirmButtonText={order?.is_archived ? 'Yes, Restore' : 'Yes, Archive'}
        confirmButtonVariant={order?.is_archived ? 'primary' : 'danger'}
      />
    </>
  );
}

const TabButton: React.FC<{ children: React.ReactNode, isActive: boolean, onClick: () => void }> = ({ children, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            'flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus-ring rounded-t-md',
            isActive ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text hover:border-gray-300 dark:hover:border-gray-600'
        )}
    >
        {children}
    </button>
);
