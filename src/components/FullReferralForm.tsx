import React from 'react';
import { Btn as Button } from '@/components/ui/Btn';
import AccordionSection from '@/components/ui/AccordionSection';
import DocumentConfigurator from '@/components/DocumentConfigurator';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { Doctor, Vendor, Patient, Order } from '@/lib/types';
import { usStates, preferredContactMethods } from '@/lib/formConstants';
import { Loader2 } from 'lucide-react';
import { ReferralForm } from '@/state/useReferralModal';

interface FullReferralFormProps {
    value: ReferralForm;
    onChange: (patch: Partial<ReferralForm>) => void;
    onBack: () => void;
    onSubmit: () => Promise<void>;
    isSaving: boolean;
    doctors: Doctor[];
    vendors: Vendor[];
}

export function FullReferralForm({ value, onChange, onBack, onSubmit, isSaving, doctors, vendors }: FullReferralFormProps) {
  
  const handleFormUpdate = (key: keyof ReferralForm, val: any) => {
    onChange({ [key]: val });
  };
  
  const doctorOptions = doctors.map(d => ({ label: d.name, value: d.id }));

  const stoplightOptions = [
    { value: 'green', label: '🟢 Green (Ready)' },
    { value: 'yellow', label: '🟡 Yellow (Needs Review)' },
    { value: 'red', label: '🔴 Red (Blocked)' },
  ];

  return (
    <div className="space-y-3 max-h-[75vh] overflow-y-auto p-6">
        <AccordionSection title="Patient Information" defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                <Input label="Patient Name" name="name" value={value.name || ''} onChange={(e) => handleFormUpdate('name', e.target.value)} isRecommended />
                <Input label="Date of Birth" name="dob" type="date" value={value.dob || ''} onChange={(e) => handleFormUpdate('dob', e.target.value)} isRecommended />
                <Input label="Referral Start Date" name="referral_date" type="date" value={value.referral_date || ''} onChange={(e) => handleFormUpdate('referral_date', e.target.value)} isRecommended />
                <Input label="Gender" name="gender" value={value.gender || ''} onChange={(e) => handleFormUpdate('gender', e.target.value)} />
                <Select label="Referring Doctor" name="referring_physician" options={doctorOptions} value={value.referring_physician || ''} onChange={(e) => handleFormUpdate('referring_physician', e.target.value)} />
                <Input label="Primary Care Provider (PCP)" name="pcp_name" value={value.pcp_name || ''} onChange={(e) => handleFormUpdate('pcp_name', e.target.value)} isRecommended />
                <Input label="PCP Phone/Fax" name="pcp_phone" value={value.pcp_phone || ''} onChange={(e) => handleFormUpdate('pcp_phone', e.target.value)} />
            </div>
        </AccordionSection>
        <AccordionSection title="Contact & Insurance" defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                <SearchableSelect
                    label="Primary Insurance"
                    value={value.primary_insurance || ''}
                    onChange={(newValue) => handleFormUpdate('primary_insurance', newValue)}
                    isRecommended
                />
                <Input label="Phone Number" name="phone_number" type="tel" value={value.phone_number || ''} onChange={(e) => handleFormUpdate('phone_number', e.target.value)} isRecommended />
                <Input label="Email" name="email" type="email" value={value.email || ''} onChange={(e) => handleFormUpdate('email', e.target.value)} />
                <Input label="Address Line 1" name="address_line1" value={value.address_line1 || ''} onChange={(e) => handleFormUpdate('address_line1', e.target.value)} wrapperClassName="sm:col-span-2" isRecommended />
                <Input label="Address Line 2" name="address_line2" value={value.address_line2 || ''} onChange={(e) => handleFormUpdate('address_line2', e.target.value)} wrapperClassName="sm:col-span-2" />
                <Input label="City" name="city" value={value.city || ''} onChange={(e) => handleFormUpdate('city', e.target.value)} isRecommended />
                <Select label="State" name="state" options={usStates} value={value.state || ''} onChange={(e) => handleFormUpdate('state', e.target.value)} isRecommended />
                <Input label="ZIP Code" name="zip" value={value.zip || ''} onChange={(e) => handleFormUpdate('zip', e.target.value)} isRecommended />
                <Select label="Preferred Contact Method" name="preferred_contact_method" options={preferredContactMethods} value={value.preferred_contact_method || ''} onChange={(e) => handleFormUpdate('preferred_contact_method', e.target.value)} />
            </div>
        </AccordionSection>
        <AccordionSection title="Administrative" defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                <Select 
                    label="Stoplight Status" 
                    name="stoplight_status" 
                    value={value.stoplight_status || 'green'} 
                    onChange={(e) => handleFormUpdate('stoplight_status', e.target.value)} 
                    options={stoplightOptions} 
                    isRecommended 
                />
            </div>
        </AccordionSection>
        <AccordionSection title="Documentation Requirements">
            <DocumentConfigurator 
                patient={value as Partial<Patient>}
                order={value as Partial<Order>}
                onPatientUpdate={(key, val) => handleFormUpdate(key, val)}
                onOrderUpdate={(key, val) => handleFormUpdate(key, val)}
            />
        </AccordionSection>
        <div className="flex gap-2 pt-4 border-t dark:border-border-color">
            <Button type="button" variant="outline" onClick={onBack}>Back to Quick Add</Button>
            <Button type="button" className="ml-auto" onClick={onSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Full Referral
            </Button>
        </div>
    </div>
  );
}
