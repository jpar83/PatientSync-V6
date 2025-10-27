import React, { useState } from 'react';
import { Btn } from './ui/Btn';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Loader2 } from 'lucide-react';

interface QuickAddData {
  patient_name: string;
  insurance_primary: string;
  referral_source: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: QuickAddData) => Promise<void>;
  onExpand: (data: QuickAddData) => void;
}

const QuickAddModal: React.FC<Props> = ({ isOpen, onClose, onSave, onExpand }) => {
  const [patientName, setPatientName] = useState('');
  const [insurance, setInsurance] = useState('');
  const [source, setSource] = useState('clinic');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!patientName.trim() || !insurance.trim()) return;
    setIsSaving(true);
    await onSave({ patient_name: patientName, insurance_primary: insurance, referral_source: source });
    setIsSaving(false);
    // Parent component will close the modal on successful save
  };

  const handleExpand = () => {
    onExpand({ patient_name: patientName, insurance_primary: insurance, referral_source: source });
  };

  if (!isOpen) return null;

  const referralSources = [
    { value: 'clinic', label: 'Clinic' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'case_manager', label: 'Case Manager' },
    { value: 'self', label: 'Self' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Quick Add Referral</h2>
        </div>
        <div className="p-6 space-y-4">
          <Input label="Patient Name" value={patientName} onChange={e => setPatientName(e.target.value)} required />
          <Input label="Primary Insurance" value={insurance} onChange={e => setInsurance(e.target.value)} required />
          <Select label="Referral Source" options={referralSources} value={source} onChange={e => setSource(e.target.value)} />
        </div>
        <div className="p-4 bg-gray-50 rounded-b-xl flex flex-col gap-3">
            <Btn onClick={handleSave} disabled={isSaving || !patientName.trim() || !insurance.trim()}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Referral
            </Btn>
            <Btn variant="outline" onClick={handleExpand}>
                Expand to Full Form
            </Btn>
            <Btn variant="outline" onClick={onClose} className="mt-2">
                Cancel
            </Btn>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;
