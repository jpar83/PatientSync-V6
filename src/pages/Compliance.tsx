import React, { useState, useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";
import { X } from "lucide-react";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useDebounce } from "../hooks/useDebounce";
import type { Order, DocumentTemplate } from "../lib/types";
import ComplianceTable from '../components/ComplianceTable';
import workflowData from '../../schemas/workflow.json';
import TableSkeleton from "../components/ui/TableSkeleton";

const Compliance: React.FC = () => {
  const [patientFilter, setPatientFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const debouncedPatientFilter = useDebounce(patientFilter, 250);

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['document_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_templates').select('name, abbrev, category, is_standard').order('name');
      if (error) throw error;
      return data as DocumentTemplate[];
    },
    staleTime: Infinity,
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['compliance_orders'],
    queryFn: async () => {
        const { data, error } = await supabase.from("orders").select("*, patients!inner(*)").order("created_at", { ascending: false });
        if (error) throw error;
        return (data as Order[]) || [];
    },
  });

  const allDocs = useMemo(() => {
    if (!templates) return [];
    const categoryOrder = ['Standard', 'Mobility', 'Respiratory', 'Wound Care', 'Telehealth', 'Insurance / Admin', 'General / Compliance'];
    return templates.sort((a, b) => {
        const catA = a.category || (a.is_standard ? 'Standard' : 'General / Compliance');
        const catB = b.category || (b.is_standard ? 'Standard' : 'General / Compliance');
        const indexA = categoryOrder.indexOf(catA);
        const indexB = categoryOrder.indexOf(catB);
        if (indexA !== indexB) return indexA - indexB;
        return a.name.localeCompare(b.name);
    });
  }, [templates]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      if (o.is_archived && !showArchived) return false;
      if (!o.is_archived && showArchived) return false;
      if (debouncedPatientFilter && !o.patients?.name?.toLowerCase().includes(debouncedPatientFilter.toLowerCase())) return false;
      if (insuranceFilter && o.patients?.primary_insurance !== insuranceFilter) return false;
      if (stageFilter && o.workflow_stage !== stageFilter) return false;
      return true;
    });
  }, [orders, showArchived, debouncedPatientFilter, insuranceFilter, stageFilter]);

  const metrics = useMemo(() => {
    const filteredCount = filteredOrders.length;
    if (filteredCount === 0) return { filteredCount: 0, readyForParCount: 0, avgCompletion: 0 };

    let readyForParCount = 0;
    let totalCompletionPercentage = 0;

    filteredOrders.forEach(o => {
        const required = o.patients?.required_documents || [];
        if (required.length > 0) {
            const completedCount = required.filter(d => o.document_status?.[d] === 'Complete').length;
            totalCompletionPercentage += (completedCount / required.length) * 100;
            if (completedCount === required.length) {
                readyForParCount++;
            }
        } else {
            readyForParCount++;
            totalCompletionPercentage += 100;
        }
    });

    return {
        filteredCount,
        readyForParCount,
        avgCompletion: filteredCount > 0 ? Math.round(totalCompletionPercentage / filteredCount) : 0,
    };
  }, [filteredOrders]);

  const insuranceOptions = useMemo(() => {
    if (!orders) return [{ label: 'All Insurances', value: '' }];
    const uniqueInsurances = Array.from(new Set(orders.map(o => o.patients?.primary_insurance).filter(Boolean) as string[]));
    uniqueInsurances.sort((a, b) => a.localeCompare(b));
    return [
      { label: 'All Insurances', value: '' },
      ...uniqueInsurances.map(ins => ({ label: ins, value: ins }))
    ];
  }, [orders]);

  const stageOptions = useMemo(() => ([{ label: 'All Stages', value: '' }, ...workflowData.workflow.map(s => ({ label: s.stage, value: s.stage }))]), []);

  const resetFilters = () => {
    setPatientFilter('');
    setInsuranceFilter('');
    setStageFilter('');
    setShowArchived(false);
  };
  
  const hasActiveFilters = patientFilter || insuranceFilter || stageFilter || showArchived;

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full pb-nav-safe">
      <div className="space-y-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Compliance Tracker</h1>
        
        <div className="kpi-grid">
            <div className="kpi-tile bg-white dark:bg-zinc-900 text-center">
                <div className="text-sm font-medium text-gray-500">Filtered Results</div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-1">{metrics.filteredCount}</div>
            </div>
            <div className="kpi-tile bg-white dark:bg-zinc-900 text-center">
                <div className="text-sm font-medium text-gray-500">Ready for PAR</div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-1">{metrics.readyForParCount}</div>
            </div>
            <div className="kpi-tile bg-white dark:bg-zinc-900 text-center">
                <div className="text-sm font-medium text-gray-500">Avg. Doc Completion</div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-1">{metrics.avgCompletion}%</div>
            </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap items-end gap-4">
            <Input 
              id="patient-filter" 
              label="Search Patient" 
              placeholder="Name..." 
              className="h-9 text-sm" 
              wrapperClassName="flex-grow min-w-[150px]"
              value={patientFilter} 
              onChange={e => setPatientFilter(e.target.value)} 
            />
            <Select 
              id="insurance-filter" 
              label="Insurance" 
              options={insuranceOptions} 
              value={insuranceFilter} 
              onChange={e => setInsuranceFilter(e.target.value)} 
              wrapperClassName="flex-grow min-w-[150px]"
              className="h-9 text-sm" 
            />
            <Select 
              id="stage-filter" 
              label="Stage" 
              options={stageOptions} 
              value={stageFilter} 
              onChange={e => setStageFilter(e.target.value)} 
              wrapperClassName="flex-grow min-w-[150px]"
              className="h-9 text-sm" 
            />
            <div className="flex items-center pb-2">
              <input 
                type="checkbox" 
                id="archived-filter" 
                checked={showArchived} 
                onChange={e => setShowArchived(e.target.checked)} 
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
              />
              <label htmlFor="archived-filter" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                Show Archived
              </label>
            </div>
            {hasActiveFilters && (
              <Btn variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                <X className="h-4 w-4 mr-1" /> Reset
              </Btn>
            )}
          </div>
        </div>

        <div className="table-wrap sticky-header">
            {(isLoadingOrders || isLoadingTemplates) ? (
            <TableSkeleton />
            ) : (
            <ComplianceTable orders={filteredOrders} documents={allDocs} patientFilter={debouncedPatientFilter} />
            )}
        </div>
      </div>
    </div>
  );
};

export default Compliance;
