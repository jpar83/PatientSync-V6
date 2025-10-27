import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import StageChangeModal from '../components/StageChangeModal';
import PatientModal from '../components/PatientModal';
import PatientDetailDrawer from '../components/PatientDetailDrawer';
import QuickAddModal from '../components/QuickAddModal';
import FilterBar, { Filters } from '../components/FilterBar';
import ExportButton from '../components/ExportButton';
import ReferralTable from '../components/ReferralTable';
import { Btn } from '../components/ui/Btn';
import type { Order, WorkflowStage, Doctor, Vendor, Patient } from '../lib/types';
import workflowData from '../../schemas/workflow.json';
import { writeAuditLog } from '../lib/auditLogger';
import { toast } from '../lib/toast';

const PAGE_SIZE = 50;

const DataGrid: React.FC = () => {
  const { user } = useAuth();
  const { term } = useSearch();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedPatientOrder, setSelectedPatientOrder] = useState<Order | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [initialPatientData, setInitialPatientData] = useState<{ patient: Partial<Patient>; order: Partial<Order> } | undefined>(undefined);
  const [filters, setFilters] = useState<Filters>({ stage: null, complete: null, insurance: null, archived: false });
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['orders', term, filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('orders')
        .select('*, patients (*), vendors(name, email)')
        .range(pageParam, pageParam + PAGE_SIZE - 1)
        .order('created_at', { ascending: false });

      query = query.eq('is_archived', filters.archived);

      if (!filters.archived) {
        if (filters.stage) query = query.eq('workflow_stage', filters.stage);
        if (filters.insurance) query = query.ilike('patients.primary_insurance', `%${filters.insurance}%`);
        if (filters.complete === 'ready') query.eq('f2f', true).eq('pt_eval', true).eq('swo', true).eq('dpd', true);
        if (filters.complete === 'incomplete') query.or('f2f.is.false,pt_eval.is.false,swo.is.false,dpd.is.false');
      }

      if (term) {
        const searchTerm = `%${term.toLowerCase()}%`;
        query = query.or(`patients.name.ilike.${searchTerm},patients.primary_insurance.ilike.${searchTerm},workflow_stage.ilike.${searchTerm}`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
  });

  const visibleOrders = useMemo(() => data?.pages.flat() ?? [], [data]);

  const fetchAuxData = useCallback(async () => {
    try {
      const [doctorsRes, vendorsRes] = await Promise.all([
        supabase.from('doctors').select('*'),
        supabase.from('vendors').select('*'),
      ]);
      if (doctorsRes.data) setDoctors(doctorsRes.data);
      if (vendorsRes.data) setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error fetching doctors/vendors:', error);
    }
  }, []);

  useEffect(() => {
    fetchAuxData();
  }, [fetchAuxData]);

  useEffect(() => {
    const patientIdToOpen = searchParams.get('patientId');
    if (patientIdToOpen && visibleOrders.length > 0) {
        const orderToOpen = visibleOrders.find(o => o.patients?.id === patientIdToOpen);
        if (orderToOpen) {
            setSelectedPatientOrder(orderToOpen);
            setHighlightedIds([orderToOpen.id]);
            setTimeout(() => setHighlightedIds([]), 3000);
        }
        searchParams.delete('patientId');
        setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, visibleOrders]);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowPatientModal(true);
      setSearchParams({}, { replace: true });
    }
    if (searchParams.get('quickadd') === 'true') {
      setShowQuickAddModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const openStageChangeModal = async (order: Order) => {
    setActiveOrder(order);
    setShowStageModal(true);
  };

  const handleStageChange = async (update: { newStage: WorkflowStage; note: string }) => {
    if (!activeOrder) return;
    await supabase.from('workflow_history').insert({ order_id: activeOrder.id, previous_stage: activeOrder.workflow_stage, new_stage: update.newStage, note: update.note, changed_by: user?.email || 'System' });
    await supabase.from('orders').update({ workflow_stage: update.newStage, last_stage_note: update.note, last_stage_change: new Date().toISOString() }).eq('id', activeOrder.id);
    setShowStageModal(false);
    setActiveOrder(null);
    invalidateAndRefetch();
  };

  const handleSavePatient = async (data: { patient: Partial<Patient>; order: Partial<Order> }) => {
    try {
        if (!data.patient.name) {
            toast('Patient Name is a required field.', 'err');
            return;
        }
        const { data: newPatient, error: patientError } = await supabase.from('patients').insert(data.patient).select().single();
        if (patientError) {
            if (patientError.code === '23505' && patientError.message.includes('patients_email_key')) {
                toast('A patient with this email address already exists.', 'err');
                return;
            }
            throw patientError;
        }
        if (!newPatient) throw new Error("Patient creation failed.");
        const { error: orderError } = await supabase.from('orders').insert({ ...data.order, patient_id: newPatient.id, workflow_stage: 'Referral Received', status: 'Pending Intake', rep_name: user?.email || 'Kristin Segal', referral_date: new Date().toISOString() });
        if (orderError) throw orderError;
        
        await writeAuditLog('patient_created', { changed_by: user?.email, changed_user: newPatient.name, patient_id: newPatient.id });
        
        const recommendedPatientFields: (keyof Patient)[] = ['name', 'dob', 'pcp_name', 'phone_number', 'address_line1', 'city', 'zip', 'primary_insurance'];
        const missingRecommended = recommendedPatientFields.some(field => !data.patient[field as keyof Patient]);
        
        if (missingRecommended) toast('Saved with missing recommended fields.', 'warning');
        else toast('Referral saved successfully.', 'ok');
        
        setShowPatientModal(false);
        invalidateAndRefetch();
    } catch (error: any) { 
        console.error("Error saving new referral:", error);
        toast(`Error saving referral: ${error.message}`, 'err');
    }
  };

  const handleQuickSave = async (data: { patient_name: string; insurance_primary: string; referral_source: string }) => {
    try {
      const { data: newPatient, error: patientError } = await supabase.from('patients').insert({ name: data.patient_name, primary_insurance: data.insurance_primary }).select().single();
      if (patientError) throw patientError;
      if (!newPatient) throw new Error("Patient creation failed.");
      const { error: orderError } = await supabase.from('orders').insert({ patient_id: newPatient.id, referral_source: data.referral_source, workflow_stage: 'Referral Received', status: 'Pending Intake', rep_name: user?.email || 'Kristin Segal', referral_date: new Date().toISOString() });
      if (orderError) throw orderError;
      await writeAuditLog('patient_created_quick', { changed_by: user?.email, changed_user: newPatient.name, patient_id: newPatient.id });
      setShowQuickAddModal(false);
      invalidateAndRefetch();
    } catch (error) { console.error("Error saving quick referral:", error); }
  };

  const handleExpandToFullForm = (data: { patient_name: string; insurance_primary: string; referral_source: string }) => {
    setInitialPatientData({ patient: { name: data.patient_name, primary_insurance: data.insurance_primary }, order: { referral_source: data.referral_source } });
    setShowQuickAddModal(false);
    setShowPatientModal(true);
  };

  const workflowStages = workflowData.workflow.map(w => w.stage) as WorkflowStage[];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-[var(--compact-gap)]">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-lg font-semibold text-gray-800">Data Grid</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton data={visibleOrders} filename={`datagrid_${new Date().toISOString().slice(0,10)}.csv`} />
          <Btn onClick={() => setShowPatientModal(true)}><Plus className="h-4 w-4 mr-2" />Add Referral</Btn>
        </div>
      </header>
      <FilterBar filters={filters} setFilters={setFilters} resultCount={visibleOrders.length} totalCount={visibleOrders.length} />
      
      <ReferralTable
        orders={visibleOrders}
        isLoading={isLoading}
        onStageChangeClick={openStageChangeModal}
        onPatientClick={setSelectedPatientOrder}
        onArchiveToggle={() => {}}
        term={term}
        selectedOrderIds={[]}
        onToggleSelection={() => {}}
      />
      {hasNextPage && (
        <div className="text-center py-2">
          <Btn variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading More...</> : 'Load More Referrals'}
          </Btn>
        </div>
      )}
      
      <QuickAddModal isOpen={showQuickAddModal} onClose={() => setShowQuickAddModal(false)} onSave={handleQuickSave} onExpand={handleExpandToFullForm} />
      {showStageModal && activeOrder && (<StageChangeModal current={activeOrder.workflow_stage as WorkflowStage} stages={workflowStages} onSave={handleStageChange} onClose={() => { setShowStageModal(false); setActiveOrder(null); }} order={activeOrder} />)}
      <PatientModal isOpen={showPatientModal} onClose={() => { setShowPatientModal(false); setInitialPatientData(undefined); }} onSave={handleSavePatient} doctors={doctors} vendors={vendors} initialData={initialPatientData} />
      <PatientDetailDrawer order={selectedPatientOrder} onClose={() => setSelectedPatientOrder(null)} onUpdate={invalidateAndRefetch} />
    </div>
  );
};

export default DataGrid;
