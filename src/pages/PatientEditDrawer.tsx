import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Save, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import SlideOver from '../components/ui/SlideOver';
import { Btn } from '../components/ui/Btn';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { Textarea } from '../components/ui/Textarea';
import AccordionSection from '../components/ui/AccordionSection';
import DocumentConfigurator from '../components/DocumentConfigurator';
import { writeAuditLog } from '../lib/auditLogger';
import { useAuth } from '../contexts/AuthContext';
import type { Patient, Order } from '../lib/types';
import { toast } from '../lib/toast';
import { usStates, preferredContactMethods } from '../lib/formConstants';
import { AUTHORIZED_ADMINS } from '../lib/constants';

interface PatientEditDrawerProps {
    patientId: string | null;
    onClose: () => void;
    onUpdate: () => void;
}

const recommendedFields: (keyof Patient)[] = ['name', 'dob', 'pcp_name', 'phone_number', 'address_line1', 'city', 'zip', 'primary_insurance'];

const PatientEditDrawer: React.FC<PatientEditDrawerProps> = ({ patientId, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [order, setOrder] = useState<Order | null>(null); // Assuming one primary order for simplicity
  const [formState, setFormState] = useState<Partial<Patient>>({});
  const [orderFormState, setOrderFormState] = useState<Partial<Order>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof Patient, string>>>({});
  const isAdmin = AUTHORIZED_ADMINS.includes(user?.email || '');

  const validate = useCallback((data: Partial<Patient>): [boolean, Partial<Record<keyof Patient, string>>] => {
    const newErrors: Partial<Record<keyof Patient, string>> = {};
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email format.';
    if (data.phone_number && (data.phone_number || '').replace(/\D/g, '').length !== 10) newErrors.phone_number = 'Phone must be 10 digits.';
    if (data.zip && !/^\d{5}$/.test(data.zip)) newErrors.zip = 'Zip code must be 5 digits.';
    return [Object.keys(newErrors).length === 0, newErrors];
  }, []);

  useEffect(() => {
    const fetchPatientData = async () => {
        if (!patientId) {
            setPatient(null);
            setOrder(null);
            return;
        }
        const { data: patientData, error: patientError } = await supabase.from('patients').select('*').eq('id', patientId).single();
        if (patientError) {
            toast('Failed to fetch patient details.', 'err');
            onClose();
            return;
        }
        
        const { data: orderData, error: orderError } = await supabase.from('orders').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1).single();
        // It's okay if orderError exists (no order yet)

        const p = patientData as Patient;
        const o = orderData as Order | null;
        setPatient(p);
        setOrder(o);
        setFormState({ ...p, dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '' });
        setOrderFormState(o || {});
        setErrors({});
    };
    fetchPatientData();
  }, [patientId, onClose]);

  // Automation for required documents
  useEffect(() => {
    let newDocs = new Set(formState.required_documents || []);
    let changed = false;

    const addDoc = (doc: string) => {
        if (!newDocs.has(doc)) {
            newDocs.add(doc);
            changed = true;
        }
    };

    if (formState.telehealth_enabled) {
        addDoc('TELE_EVAL');
        addDoc('TELE_CONSENT');
    }
    if (formState.financial_assistance) {
        addDoc('FIN_HARDSHIP');
        addDoc('ABN');
    }
    if (formState.primary_insurance?.toLowerCase().includes('medicaid') || formState.primary_insurance?.toLowerCase().includes('uhc')) {
        addDoc('AUTH_FORM');
        addDoc('PAR_REQ');
    }
    if (orderFormState.chair_type?.toLowerCase().includes('power')) {
        addDoc('ATP_EVAL');
        addDoc('LMN');
        addDoc('HOME_ASSESS');
    }

    if (changed) {
        setFormState(prev => ({ ...prev, required_documents: Array.from(newDocs) }));
    }
  }, [formState.telehealth_enabled, formState.financial_assistance, formState.primary_insurance, orderFormState.chair_type, formState.required_documents]);


  const handleFormUpdate = (entity: 'patient' | 'order', key: string, value: any) => {
    if (entity === 'patient') {
      setFormState(prev => {
          const newState = { ...prev, [key]: value };
          const [, newErrors] = validate(newState);
          setErrors(newErrors);
          return newState;
      });
    } else {
      setOrderFormState(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = async () => {
    const [isValid, validationErrors] = validate(formState);
    if (!isValid) {
        setErrors(validationErrors);
        toast('Please correct the format errors before saving.', 'err');
        return;
    }
    setIsSaving(true);
    const patientPayload = { ...formState };
    delete patientPayload.id;
    delete patientPayload.created_at;

    // Handle empty date string for database compatibility
    if (patientPayload.dob === '') {
      patientPayload.dob = null;
    }

    try {
      const { error: patientUpdateError } = await supabase.from('patients').update(patientPayload).eq('id', patient!.id);
      if (patientUpdateError) throw patientUpdateError;

      // Also save order details if they exist
      if(order?.id) {
        const orderPayload = { ...orderFormState };
        delete orderPayload.id;
        delete orderPayload.created_at;
        delete orderPayload.patients;
        delete orderPayload.vendors;
        const { error: orderUpdateError } = await supabase.from('orders').update(orderPayload).eq('id', order.id);
        if (orderUpdateError) throw orderUpdateError;
      }
      
      await writeAuditLog('patient_update', { changed_by: user?.email, changed_user: patientPayload.name || patient!.name, patient_id: patient!.id });
      
      const missingRecommended = recommendedFields.some(field => !formState[field]);
      if (missingRecommended) toast('Saved with missing recommended fields.', 'warning');
      else toast('Patient details saved successfully.', 'ok');
      onUpdate();
    } catch (error: any) {
      console.error("Failed to save patient details:", error);
      if (error.code === '23505') toast('This email address is already in use.', 'err');
      else toast(`Failed to save patient details.`, 'err');
    } finally {
      setIsSaving(false);
    }
  };

  if (!patientId) return null;
  if (!patient) return <SlideOver isOpen={true} onClose={onClose} title="Edit Patient Details"><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div></SlideOver>;

  return (
    <SlideOver isOpen={true} onClose={onClose} title="Edit Patient Details">
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <AccordionSection title="Patient Information" defaultOpen>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <Input label="Patient Name" name="name" value={formState.name || ''} onChange={(e) => handleFormUpdate('patient', 'name', e.target.value)} isRecommended />
                    <Input label="Date of Birth" name="dob" type="date" value={formState.dob || ''} onChange={(e) => handleFormUpdate('patient', 'dob', e.target.value)} isRecommended />
                    <Input label="Gender" name="gender" value={formState.gender || ''} onChange={(e) => handleFormUpdate('patient', 'gender', e.target.value)} />
                    <Input label="Referring Doctor" name="referring_physician" value={formState.referring_physician || ''} onChange={(e) => handleFormUpdate('patient', 'referring_physician', e.target.value)} />
                    <Input label="Primary Care Provider (PCP)" name="pcp_name" value={formState.pcp_name || ''} onChange={(e) => handleFormUpdate('patient', 'pcp_name', e.target.value)} isRecommended />
                    <Input label="PCP Phone/Fax" name="pcp_phone" value={formState.pcp_phone || ''} onChange={(e) => handleFormUpdate('patient', 'pcp_phone', e.target.value)} />
                </div>
            </AccordionSection>
            <AccordionSection title="Contact Information" defaultOpen>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <Input label="Phone Number" name="phone_number" type="tel" value={formState.phone_number || ''} onChange={(e) => handleFormUpdate('patient', 'phone_number', e.target.value)} isRecommended error={errors.phone_number} />
                    <Input label="Email" name="email" type="email" value={formState.email || ''} onChange={(e) => handleFormUpdate('patient', 'email', e.target.value)} error={errors.email} />
                    <Input label="Address Line 1" name="address_line1" value={formState.address_line1 || ''} onChange={(e) => handleFormUpdate('patient', 'address_line1', e.target.value)} wrapperClassName="sm:col-span-2" isRecommended />
                    <Input label="Address Line 2" name="address_line2" value={formState.address_line2 || ''} onChange={(e) => handleFormUpdate('patient', 'address_line2', e.target.value)} wrapperClassName="sm:col-span-2" />
                    <Input label="City" name="city" value={formState.city || ''} onChange={(e) => handleFormUpdate('patient', 'city', e.target.value)} isRecommended />
                    <Select label="State" name="state" options={usStates} value={formState.state || ''} onChange={(e) => handleFormUpdate('patient', 'state', e.target.value)} isRecommended />
                    <Input label="ZIP Code" name="zip" value={formState.zip || ''} onChange={(e) => handleFormUpdate('patient', 'zip', e.target.value)} isRecommended error={errors.zip} />
                    <Select label="Preferred Contact Method" name="preferred_contact_method" options={preferredContactMethods} value={formState.preferred_contact_method || ''} onChange={(e) => handleFormUpdate('patient', 'preferred_contact_method', e.target.value)} />
                </div>
            </AccordionSection>
            <AccordionSection title="Documentation Requirements">
                <DocumentConfigurator 
                    patient={formState}
                    order={orderFormState}
                    onPatientUpdate={(key, val) => handleFormUpdate('patient', key, val)}
                    onOrderUpdate={(key, val) => handleFormUpdate('order', key, val)}
                />
            </AccordionSection>
            {isAdmin && (
                <AccordionSection title="Administrative">
                    <div className="space-y-4">
                        <Input label="Patient ID" name="id" value={formState.id || ''} readOnly disabled />
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Active Status</span>
                            <button onClick={() => handleFormUpdate('patient', 'archived', !formState.archived)} className="flex items-center gap-2 text-sm font-semibold">
                                {!formState.archived ? <ToggleRight className="h-6 w-6 text-teal-600" /> : <ToggleLeft className="h-6 w-6 text-gray-400" />}
                                {!formState.archived ? 'Active' : 'Archived'}
                            </button>
                        </div>
                    </div>
                </AccordionSection>
            )}
        </div>
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 sm:px-6 flex justify-end gap-3 sticky bottom-0 bg-white">
            <Btn variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={isSaving || Object.keys(errors).length > 0}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Patient
            </Btn>
        </div>
      </div>
    </SlideOver>
  );
};

export default PatientEditDrawer;
