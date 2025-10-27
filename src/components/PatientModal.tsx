import React, { useState, useEffect, useCallback } from 'react';
import { Btn } from './ui/Btn';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { Textarea } from './ui/Textarea';
import SlideOver from './ui/SlideOver';
import AccordionSection from './ui/AccordionSection';
import DocumentConfigurator from './DocumentConfigurator';
import type { Doctor, Vendor, Patient, Order } from '../lib/types';
import { usStates, preferredContactMethods } from '../lib/formConstants';
import { toast } from '../lib/toast';
import { Loader2 } from 'lucide-react';

interface PatientModalProps {
  isOpen: boolean;
  doctors: Doctor[];
  vendors: Vendor[];
  onSave: (data: { patient: Partial<Patient>; order: Partial<Order> }) => Promise<void>;
  onClose: () => void;
  initialData?: { patient: Partial<Patient>; order: Partial<Order> };
}

const recommendedPatientFields: (keyof Patient)[] = ['name', 'dob', 'pcp_name', 'phone_number', 'address_line1', 'city', 'zip', 'primary_insurance'];

export default function PatientModal({ isOpen, doctors, vendors, onSave, onClose, initialData }: PatientModalProps) {
  const [patientData, setPatientData] = useState<Partial<Patient>>({});
  const [orderData, setOrderData] = useState<Partial<Order>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof Patient, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = useCallback((patient: Partial<Patient>): [boolean, Partial<Record<keyof Patient, string>>] => {
    const newErrors: Partial<Record<keyof Patient, string>> = {};
    if (!patient.name?.trim()) newErrors.name = 'Patient name is required.';
    if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) newErrors.email = 'Invalid email format.';
    if (patient.phone_number && (patient.phone_number || '').replace(/\D/g, '').length !== 10) newErrors.phone_number = 'Phone must be 10 digits.';
    if (patient.zip && !/^\d{5}$/.test(patient.zip)) newErrors.zip = 'Zip code must be 5 digits.';
    return [Object.keys(newErrors).length === 0, newErrors];
  }, []);

  useEffect(() => {
    if (isOpen) {
      const initialPatient = initialData?.patient || {};
      const initialOrder = initialData?.order || {};
      
      if (!initialPatient.required_documents) {
        initialPatient.required_documents = ['F2F', 'PT_EVAL', 'SWO', 'DPD', 'HIPAA', 'INS_CARD', 'POD'];
      }
      
      setPatientData(initialPatient);
      setOrderData(initialOrder);
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    let newDocs = new Set(patientData.required_documents || []);
    let changed = false;

    const addDoc = (doc: string) => {
        if (!newDocs.has(doc)) {
            newDocs.add(doc);
            changed = true;
        }
    };

    if (patientData.telehealth_enabled) {
        addDoc('TELE_EVAL');
        addDoc('TELE_CONSENT');
    }
    if (patientData.financial_assistance) {
        addDoc('FIN_HARDSHIP');
        addDoc('ABN');
    }
    if (patientData.primary_insurance?.toLowerCase().includes('medicaid') || patientData.primary_insurance?.toLowerCase().includes('uhc')) {
        addDoc('AUTH_FORM');
        addDoc('PAR_REQ');
    }
    if (orderData.chair_type?.toLowerCase().includes('power')) {
        addDoc('ATP_EVAL');
        addDoc('LMN');
        addDoc('HOME_ASSESS');
    }

    if (changed) {
        setPatientData(prev => ({ ...prev, required_documents: Array.from(newDocs) }));
    }
  }, [isOpen, patientData.telehealth_enabled, patientData.financial_assistance, patientData.primary_insurance, orderData.chair_type, patientData.required_documents]);


  const handleFormUpdate = (entity: 'patient' | 'order', key: string, value: any) => {
    if (entity === 'patient') {
      setPatientData(prev => {
        const newState = { ...prev, [key]: value };
        const [, newErrors] = validate(newState);
        setErrors(newErrors);
        return newState;
      });
    } else {
      setOrderData(prev => ({ ...prev, [key]: value }));
    }
  };
  
  const handleSave = async () => {
    const [isValid, validationErrors] = validate(patientData);
    if (!isValid) {
      setErrors(validationErrors);
      toast('Please correct the validation errors before saving.', 'err');
      return;
    }
    
    setIsSaving(true);
    await onSave({ patient: patientData, order: orderData });
    setIsSaving(false);
  };

  const doctorOptions = doctors.map(d => ({ label: d.name, value: d.id }));
  const vendorOptions = vendors.map(v => ({ label: v.name, value: v.id }));
  const referralSources = [{ value: 'clinic', label: 'Clinic' }, { value: 'hospital', label: 'Hospital' }, { value: 'case_manager', label: 'Case Manager' }, { value: 'self', label: 'Self' }, { value: 'other', label: 'Other' }];

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="New Patient Referral">
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <AccordionSection title="Patient Information" defaultOpen>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <Input label="Patient Name" name="name" value={patientData.name || ''} onChange={(e) => handleFormUpdate('patient', 'name', e.target.value)} isRecommended error={errors.name} />
                    <Input label="Date of Birth" name="dob" type="date" value={patientData.dob || ''} onChange={(e) => handleFormUpdate('patient', 'dob', e.target.value)} isRecommended />
                    <Input label="Gender" name="gender" value={patientData.gender || ''} onChange={(e) => handleFormUpdate('patient', 'gender', e.target.value)} />
                    <Select label="Referring Doctor" name="referring_physician" options={doctorOptions} value={patientData.referring_physician || ''} onChange={(e) => handleFormUpdate('patient', 'referring_physician', e.target.value)} />
                    <Input label="Primary Care Provider (PCP)" name="pcp_name" value={patientData.pcp_name || ''} onChange={(e) => handleFormUpdate('patient', 'pcp_name', e.target.value)} isRecommended />
                    <Input label="PCP Phone/Fax" name="pcp_phone" value={patientData.pcp_phone || ''} onChange={(e) => handleFormUpdate('patient', 'pcp_phone', e.target.value)} />
                </div>
            </AccordionSection>
            <AccordionSection title="Contact Information" defaultOpen>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <Input label="Phone Number" name="phone_number" type="tel" value={patientData.phone_number || ''} onChange={(e) => handleFormUpdate('patient', 'phone_number', e.target.value)} isRecommended error={errors.phone_number} />
                    <Input label="Email" name="email" type="email" value={patientData.email || ''} onChange={(e) => handleFormUpdate('patient', 'email', e.target.value)} error={errors.email} />
                    <Input label="Address Line 1" name="address_line1" value={patientData.address_line1 || ''} onChange={(e) => handleFormUpdate('patient', 'address_line1', e.target.value)} wrapperClassName="sm:col-span-2" isRecommended />
                    <Input label="Address Line 2" name="address_line2" value={patientData.address_line2 || ''} onChange={(e) => handleFormUpdate('patient', 'address_line2', e.target.value)} wrapperClassName="sm:col-span-2" />
                    <Input label="City" name="city" value={patientData.city || ''} onChange={(e) => handleFormUpdate('patient', 'city', e.target.value)} isRecommended />
                    <Select label="State" name="state" options={usStates} value={patientData.state || ''} onChange={(e) => handleFormUpdate('patient', 'state', e.target.value)} isRecommended />
                    <Input label="ZIP Code" name="zip" value={patientData.zip || ''} onChange={(e) => handleFormUpdate('patient', 'zip', e.target.value)} isRecommended error={errors.zip} />
                    <Select label="Preferred Contact Method" name="preferred_contact_method" options={preferredContactMethods} value={patientData.preferred_contact_method || ''} onChange={(e) => handleFormUpdate('patient', 'preferred_contact_method', e.target.value)} />
                </div>
            </AccordionSection>
             <AccordionSection title="Documentation Requirements">
                <DocumentConfigurator 
                    patient={patientData}
                    order={orderData}
                    onPatientUpdate={(key, val) => handleFormUpdate('patient', key, val)}
                    onOrderUpdate={(key, val) => handleFormUpdate('order', key, val)}
                />
            </AccordionSection>
        </div>
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 sm:px-6 flex justify-end gap-3 sticky bottom-0 bg-white">
          <Btn variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={isSaving || Object.keys(errors).length > 0}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Referral
          </Btn>
        </div>
      </div>
    </SlideOver>
  );
}
