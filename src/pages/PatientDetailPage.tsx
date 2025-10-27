import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ArrowLeft, Edit, Download, Archive, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PatientDrawerAdaptive from '@/components/PatientDrawerAdaptive';
import EmptyState from '@/components/ui/EmptyState';
import type { Patient, Order, WorkflowStage, Denial, Equipment } from '@/lib/types';
import ViewPatientDetails from '@/components/ViewPatientDetails';
import WorkflowHub from '@/components/WorkflowHub';
import AddNoteModal from '@/components/AddNoteModal';
import StageChangeModal from '@/components/StageChangeModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { isBackward } from '@/lib/utils';
import workflowData from '../../schemas/workflow.json';
import { useNoteMutations } from '@/hooks/useNoteMutations';
import { addNote as apiAddNote } from '@/api/notes.api';
import { useExportCenter } from '@/state/useExportCenter';
import ArchivePatientModal from '@/components/ArchivePatientModal';
import { cn } from '@/lib/utils';

const PatientDetailPage: React.FC = () => {
    const { id: patientId } = useParams<{ id: string }>();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showStageModal, setShowStageModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const openExportModal = useExportCenter(state => state.openModal);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['patient_full_details', patientId],
        queryFn: async () => {
            if (!patientId) return null;

            const { data: patientData, error: patientError } = await supabase.from('patients').select('*').eq('id', patientId).single();
            if (patientError) throw patientError;

            const { data: orderData, error: orderError } = await supabase.from('orders').select('*, vendors(name, email)').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1).single();
            if (orderError && orderError.code !== 'PGRST116') console.warn("Error fetching primary order:", orderError);

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
        enabled: !!patientId,
    });
    
    const { addNote } = useNoteMutations(patientId!, refetch);

    const patient = data?.patient;
    const order = data?.order;

    const handleAddNoteSave = async (note: string) => {
        addNote.mutate(note);
    };

    const handleStageSave = async ({ newStage, note, regressionReason }: { newStage: WorkflowStage; note: string; regressionReason?: string }) => {
        if (!order || !patient) return;
        
        const isRegression = isBackward(order.workflow_stage, newStage);
    
        const { error: orderError } = await supabase.from('orders').update({ workflow_stage: newStage, last_stage_note: note, last_stage_change: new Date().toISOString() }).eq('id', order.id);
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
        refetch();
        queryClient.invalidateQueries({ queryKey: ['referrals_direct_all'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
        queryClient.invalidateQueries({ queryKey: ['regression_insights'] });
        setShowStageModal(false);
    };

    const handleArchiveConfirm = async (note: string) => {
        if (!patient) return;
        setIsArchiving(true);
        const newArchivedStatus = !patient.archived;
    
        try {
            const { error: patientError } = await supabase
                .from('patients')
                .update({ archived: newArchivedStatus })
                .eq('id', patient.id);
            if (patientError) throw patientError;
    
            const { error: orderError } = await supabase
                .from('orders')
                .update({ is_archived: newArchivedStatus })
                .eq('patient_id', patient.id);
            if (orderError) console.warn('Could not update associated orders, but patient status was changed.', orderError);
    
            await apiAddNote({
                patient_id: patient.id,
                body: `Patient ${newArchivedStatus ? 'archived' : 'restored'}. Reason: ${note}`,
                source: 'manual',
            });
    
            toast(`Patient has been ${newArchivedStatus ? 'archived' : 'restored'}.`, 'ok');
            setShowArchiveModal(false);
            refetch();
            queryClient.invalidateQueries({ queryKey: ['allDataForPatientsPage'] });
        } catch (error: any) {
            toast(`Error: ${error.message}`, 'err');
        } finally {
            setIsArchiving(false);
        }
    };

    const workflowStages = workflowData.workflow.map(w => w.stage) as WorkflowStage[];

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    if (isError || !data || !patient) {
        return <div className="p-8"><EmptyState title="Error" message="Could not load patient details." /></div>;
    }

    const { equipment, denials } = data;

    return (
        <div className="h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-nav-safe">
                <header className="flex justify-between items-center">
                    <Button asChild variant="ghost">
                        <Link to="/patients">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Patients
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openExportModal({ filters: { patients: [patient.id] } })}>
                            <Download className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Export</span>
                        </Button>
                        <Button size="sm" onClick={() => setIsDrawerOpen(true)}>
                            <Edit className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Edit</span>
                        </Button>
                        <Button 
                            size="sm"
                            variant={patient.archived ? 'default' : 'destructive'} 
                            onClick={() => setShowArchiveModal(true)}
                        >
                            {patient.archived ? <RotateCcw className="h-4 w-4 md:mr-2" /> : <Archive className="h-4 w-4 md:mr-2" />}
                            <span className="hidden md:inline">{patient.archived ? 'Restore' : 'Archive'}</span>
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <ViewPatientDetails patient={patient} order={order} equipment={equipment} denials={denials} />
                    </div>
                    <div className="lg:col-span-1">
                        <WorkflowHub 
                            order={order} 
                            patient={patient} 
                            onStageChangeClick={() => setShowStageModal(true)} 
                            onAddNoteClick={() => setShowNoteModal(true)}
                            onUpdate={refetch}
                        />
                    </div>
                </div>
            </div>

            <PatientDrawerAdaptive
                patientId={patientId}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onUpdate={() => {
                    refetch();
                    setIsDrawerOpen(false);
                }}
                startInEditMode={true}
            />

            <AddNoteModal 
                isOpen={showNoteModal} 
                onClose={() => setShowNoteModal(false)} 
                onSave={handleAddNoteSave} 
            />
            
            {showStageModal && order && (
                <StageChangeModal
                    current={order.workflow_stage as WorkflowStage}
                    stages={workflowStages}
                    onSave={handleStageSave}
                    onClose={() => setShowStageModal(false)}
                    order={order}
                />
            )}

            <ArchivePatientModal
                isOpen={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                onConfirm={handleArchiveConfirm}
                isArchiving={isArchiving}
                patientName={patient.name || 'this patient'}
                isArchived={!!patient.archived}
            />
        </div>
    );
};

export default PatientDetailPage;
