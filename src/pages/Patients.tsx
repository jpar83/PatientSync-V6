import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Patient, Order, ArchiveFilter } from '@/lib/types';
import { Loader2, Download, Archive } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useDebounce } from '@/hooks/useDebounce';
import { highlight } from '@/lib/highlight';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useExportCenter } from '@/state/useExportCenter';
import { Checkbox } from '@/components/ui/Checkbox';
import PatientBulkActionsFooter from '@/components/PatientBulkActionsFooter';
import SimpleConfirmationModal from '@/components/ui/SimpleConfirmationModal';
import { toast } from '@/lib/toast';
import { useUIState } from '@/state/useUIState';
import ReferralFilterBar from '@/components/ReferralFilterBar';
import AdvancedFilterPanel, { AdvancedFilters } from '@/components/AdvancedFilterPanel';
import { useVirtualizer } from '@tanstack/react-virtual';

const Patients: React.FC = () => {
  const { term } = useSearch();
  const debouncedTerm = useDebounce(term, 300);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('active');
  const [stoplightFilter, setStoplightFilter] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [isAdvancedPanelOpen, setIsAdvancedPanelOpen] = useState(false);
  const openExportModal = useExportCenter(state => state.openModal);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const setBulkActionsVisible = useUIState(state => state.setBulkActionsVisible);
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['allDataForPatientsPage'],
    queryFn: async () => {
      const [patientsRes, ordersRes] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('orders').select('id, patient_id, workflow_stage, status, is_archived, created_at, updated_at, referral_date, document_status'),
      ]);
      if (patientsRes.error) throw patientsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      return {
        patients: (patientsRes.data as Patient[]) || [],
        orders: (ordersRes.data as Order[]) || [],
      };
    },
  });
  
  useEffect(() => {
    setBulkActionsVisible(selectedPatientIds.length > 0);
  }, [selectedPatientIds, setBulkActionsVisible]);

  const filteredPatients = useMemo(() => {
    if (!allData) return [];
    const { patients, orders } = allData;

    return patients.filter(patient => {
        const patientOrders = orders.filter(o => o.patient_id === patient.id);
        const latestOrder = patientOrders.length > 0
            ? [...patientOrders].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0]
            : null;

        const isArchived = patient.archived === true || latestOrder?.is_archived === true || ['Delivered', 'Closed', 'Archived'].includes(latestOrder?.status || '');

        if (archiveFilter === 'active' && isArchived) return false;
        if (archiveFilter === 'archived' && !isArchived) return false;

        if (debouncedTerm) {
            const lowercasedTerm = debouncedTerm.toLowerCase();
            if (
                !patient.name?.toLowerCase().includes(lowercasedTerm) &&
                !patient.email?.toLowerCase().includes(lowercasedTerm) &&
                !patient.primary_insurance?.toLowerCase().includes(lowercasedTerm)
            ) return false;
        }

        if (stoplightFilter && patient.stoplight_status !== stoplightFilter) {
            return false;
        }
        
        const { firstName, lastName, dob, insurance, dateStart, dateEnd, workflowStage, docFilterKey, docFilterStatus } = advancedFilters;

        if (firstName && !patient.name?.toLowerCase().includes(firstName.toLowerCase())) return false;
        if (lastName && !patient.name?.toLowerCase().includes(lastName.toLowerCase())) return false;
        if (dob && patient.dob) {
            const patientDob = new Date(patient.dob).toISOString().split('T')[0];
            if (patientDob !== dob) return false;
        }
        if (insurance && !patient.primary_insurance?.toLowerCase().includes(insurance.toLowerCase())) return false;

        if (dateStart || dateEnd || workflowStage || (docFilterKey && docFilterStatus)) {
            if (patientOrders.length === 0) return false;
            
            const hasMatchingOrder = patientOrders.some(order => {
                if (dateStart && order.referral_date && new Date(order.referral_date) < new Date(dateStart)) return false;
                if (dateEnd && order.referral_date) {
                    const endDate = new Date(dateEnd);
                    endDate.setHours(23, 59, 59, 999);
                    if (new Date(order.referral_date) > endDate) return false;
                }
                if (workflowStage && order.workflow_stage !== workflowStage) return false;
                if (docFilterKey && docFilterStatus) {
                    const isRequired = patient.required_documents?.includes(docFilterKey);
                    const isComplete = order.document_status?.[docFilterKey] === 'Complete';
                    if (docFilterStatus === 'Complete' && !isComplete) return false;
                    if (docFilterStatus === 'Missing' && (!isRequired || isComplete)) return false;
                    if (docFilterStatus === 'Not Required' && isRequired) return false;
                }
                return true;
            });
            if (!hasMatchingOrder) return false;
        }

        return true;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allData, debouncedTerm, archiveFilter, stoplightFilter, advancedFilters]);
  
  useEffect(() => {
    setSelectedPatientIds([]);
  }, [debouncedTerm, archiveFilter, stoplightFilter, advancedFilters]);

  const rowVirtualizer = useVirtualizer({
    count: filteredPatients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 57, // Estimated row height
    overscan: 5,
  });

  const handleViewPatient = (patientId: string) => {
    navigate(`/patient/${patientId}`);
  };

  const handleToggleSelection = (patientId: string) => {
    setSelectedPatientIds(prev =>
        prev.includes(patientId)
            ? prev.filter(id => id !== patientId)
            : [...prev, patientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPatientIds.length === filteredPatients.length) {
        setSelectedPatientIds([]);
    } else {
        setSelectedPatientIds(filteredPatients.map(p => p.id));
    }
  };

  const handleBulkArchive = async () => {
    setIsArchiving(true);
    const { error } = await supabase
        .from('patients')
        .update({ archived: true })
        .in('id', selectedPatientIds);

    if (error) {
        toast(`Failed to archive patients: ${error.message}`, 'err');
    } else {
        toast(`${selectedPatientIds.length} patients have been archived.`, 'ok');
        queryClient.invalidateQueries({ queryKey: ['allDataForPatientsPage'] });
        setSelectedPatientIds([]);
    }
    setIsArchiving(false);
    setShowArchiveConfirm(false);
  };

  const clearAllFilters = () => {
    setArchiveFilter('active');
    setStoplightFilter(null);
    setAdvancedFilters({});
  };

  const isAdvancedFilterActive = Object.values(advancedFilters).some(v => v);
  const allSelected = filteredPatients.length > 0 && selectedPatientIds.length === filteredPatients.length;

  const viewQuery = useMemo(() => {
    const query: Record<string, any> = {};
    if (debouncedTerm) query.search = debouncedTerm;
    if (archiveFilter !== 'active') query.archive = archiveFilter;
    if (stoplightFilter) query.stoplight = stoplightFilter;
    if (isAdvancedFilterActive) query.advanced = 'Active';
    return query;
  }, [debouncedTerm, archiveFilter, stoplightFilter, isAdvancedFilterActive]);

  return (
    <>
      <div className="h-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-text">Patients</h1>
        </header>

        <ReferralFilterBar
            filterOptions={[]}
            activeFilters={[]}
            onToggleFilter={() => {}}
            onClearFilters={clearAllFilters}
            accountFilter={null}
            archiveFilter={archiveFilter}
            onArchiveFilterChange={setArchiveFilter}
            onSelectAll={handleSelectAll}
            numSelected={selectedPatientIds.length}
            totalCount={filteredPatients.length}
            onOpenAdvanced={() => setIsAdvancedPanelOpen(true)}
            isAdvancedFilterActive={isAdvancedFilterActive}
            onExportClick={() => openExportModal({ reportType: 'patient_details', filters: viewQuery })}
            stoplightFilter={stoplightFilter}
            onStoplightFilterChange={setStoplightFilter}
        />

        <div className="flex-1 overflow-hidden soft-card">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div ref={parentRef} className="h-full overflow-y-auto pb-nav-safe">
              <table className="min-w-full w-full text-sm" style={{ tableLayout: 'fixed' }}>
                <thead className="sticky top-0 bg-gray-100 dark:bg-zinc-800 text-muted uppercase text-xs z-10">
                  <tr>
                    <th className="p-3 text-center" style={{ width: '3rem' }}>
                        <Checkbox
                            label=""
                            checked={allSelected}
                            indeterminate={selectedPatientIds.length > 0 && !allSelected}
                            onChange={handleSelectAll}
                        />
                    </th>
                    <th className="p-3 text-left" style={{ width: '25%' }}>Name</th>
                    <th className="p-3 text-left" style={{ width: '25%' }}>Email</th>
                    <th className="p-3 text-left" style={{ width: '15%' }}>Phone</th>
                    <th className="p-3 text-left" style={{ width: '20%' }}>Payer</th>
                    <th className="p-3 text-center" style={{ width: 'auto' }}>Case Status</th>
                  </tr>
                </thead>
                <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map(virtualItem => {
                      const patient = filteredPatients[virtualItem.index];
                      if (!patient) return null;
                      
                      const isSelected = selectedPatientIds.includes(patient.id);

                      const patientOrders = allData?.orders.filter(o => o.patient_id === patient.id) || [];
                      const latestOrder = patientOrders.length > 0
                          ? [...patientOrders].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0]
                          : null;
                      const isArchived = patient.archived === true || latestOrder?.is_archived === true || ['Delivered', 'Closed', 'Archived'].includes(latestOrder?.status || '');
                      const statusDisplay = isArchived ? 'Archived' : (latestOrder?.workflow_stage || 'Active');
                      
                      return (
                        <tr
                            key={virtualItem.key}
                            onClick={() => handleViewPatient(patient.id)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                            className={cn("border-b border-gray-100 dark:border-zinc-800 cursor-pointer", isSelected && "bg-teal-50 dark:bg-teal-900/50")}
                        >
                            <td className="p-3 text-center" style={{ width: '3rem' }} onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    label=""
                                    checked={isSelected}
                                    onChange={() => handleToggleSelection(patient.id)}
                                />
                            </td>
                            <td className="p-3 font-medium text-text" style={{ width: '25%' }}>
                              <div className="truncate" dangerouslySetInnerHTML={{ __html: highlight(patient.name || '', debouncedTerm) }} />
                            </td>
                            <td className="p-3 text-muted" style={{ width: '25%' }}>
                              <div className="truncate" dangerouslySetInnerHTML={{ __html: highlight(patient.email || '', debouncedTerm) }} />
                            </td>
                            <td className="p-3 text-muted" style={{ width: '15%' }}>{patient.phone_number}</td>
                            <td className="p-3 text-muted" style={{ width: '20%' }}>{patient.primary_insurance}</td>
                            <td className="p-3 text-center" style={{ width: 'auto' }}>
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-semibold',
                                isArchived ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-zinc-300'
                              )}>
                                {statusDisplay}
                              </span>
                            </td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <PatientBulkActionsFooter
        selectedCount={selectedPatientIds.length}
        onClear={() => setSelectedPatientIds([])}
        onArchive={() => setShowArchiveConfirm(true)}
      />
      <SimpleConfirmationModal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleBulkArchive}
        isLoading={isArchiving}
        title={`Archive ${selectedPatientIds.length} Patients`}
        message={`Are you sure you want to archive the ${selectedPatientIds.length} selected patients? This action can be reversed later.`}
        confirmButtonText="Yes, Archive"
        confirmButtonVariant="danger"
      />
      <AdvancedFilterPanel
        isOpen={isAdvancedPanelOpen}
        onClose={() => setIsAdvancedPanelOpen(false)}
        activeFilters={advancedFilters}
        onApply={setAdvancedFilters}
        onClear={() => setAdvancedFilters({})}
      />
    </>
  );
};

export default Patients;
