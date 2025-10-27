import React, { useState, useEffect } from 'react';
import SlideOver from './ui/SlideOver';
import { Button } from './ui/button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { X, SlidersHorizontal } from 'lucide-react';
import type { AdvancedFilters } from '@/pages/Referrals';
import { labelMap, DocKey } from '@/lib/docMapping';
import workflowData from '../../schemas/workflow.json';

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
  onClear: () => void;
}

const docOptions = Object.keys(labelMap).map(key => ({
    value: key,
    label: labelMap[key as DocKey],
}));

const stageOptions = workflowData.workflow.map(s => ({
    value: s.stage,
    label: s.stage,
}));

const docStatusOptions = [
    { value: 'Complete', label: 'Is Complete' },
    { value: 'Missing', label: 'Is Missing' },
    { value: 'Not Required', label: 'Is Not Required' },
];

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({ isOpen, onClose, activeFilters, onApply, onClear }) => {
  const [filters, setFilters] = useState<AdvancedFilters>(activeFilters);

  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters, isOpen]);

  const handleInputChange = (field: keyof AdvancedFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: AdvancedFilters = {
        firstName: '',
        lastName: '',
        dob: '',
        insurance: '',
        dateStart: '',
        dateEnd: '',
        workflowStage: '',
        docFilterKey: '',
        docFilterStatus: '',
    };
    setFilters(clearedFilters);
    onClear();
  };

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Advanced Filters">
        <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <h3 className="text-base font-semibold text-text">Patient Details</h3>
                    <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <Input label="First Name" value={filters.firstName || ''} onChange={e => handleInputChange('firstName', e.target.value)} />
                        <Input label="Last Name" value={filters.lastName || ''} onChange={e => handleInputChange('lastName', e.target.value)} />
                        <Input label="Date of Birth" type="date" value={filters.dob || ''} onChange={e => handleInputChange('dob', e.target.value)} />
                    </div>
                </div>
                <div>
                    <h3 className="text-base font-semibold text-text">Referral Details</h3>
                     <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <Input label="Insurance Provider" value={filters.insurance || ''} onChange={e => handleInputChange('insurance', e.target.value)} />
                        <Input label="Referral Date From" type="date" value={filters.dateStart || ''} onChange={e => handleInputChange('dateStart', e.target.value)} />
                        <Input label="Referral Date To" type="date" value={filters.dateEnd || ''} onChange={e => handleInputChange('dateEnd', e.target.value)} />
                    </div>
                </div>
                <div>
                    <h3 className="text-base font-semibold text-text">Workflow & Documents</h3>
                     <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <Select label="Workflow Stage" options={stageOptions} value={filters.workflowStage || ''} onChange={e => handleInputChange('workflowStage', e.target.value)} />
                        <Select label="Document Type" options={docOptions} value={filters.docFilterKey || ''} onChange={e => handleInputChange('docFilterKey', e.target.value)} />
                        <Select label="Document Status" options={docStatusOptions} value={filters.docFilterStatus || ''} onChange={e => handleInputChange('docFilterStatus', e.target.value)} disabled={!filters.docFilterKey} />
                    </div>
                </div>
            </div>
            <div className="flex-shrink-0 border-t border-border-color px-4 py-3 sm:px-6 flex justify-between">
                <Button variant="ghost" onClick={handleClear}>
                    <X className="h-4 w-4 mr-2" />
                    Reset Filters
                </Button>
                <Button onClick={handleApply}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Apply Filters
                </Button>
            </div>
        </div>
    </SlideOver>
  );
};

export default AdvancedFilterPanel;
