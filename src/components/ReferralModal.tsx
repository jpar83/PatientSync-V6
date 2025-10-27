import React, { useState } from 'react';
import { useReferralModal, ReferralForm } from "@/state/useReferralModal";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/button';
import { FullReferralForm } from './FullReferralForm';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { writeAuditLog } from '@/lib/auditLogger';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import type { Patient, Order } from '@/lib/types';
import { DocKey, docTemplates } from '@/lib/docMapping';
import SearchableSelect from './ui/SearchableSelect';

export default function ReferralModal() {
  const { open, close, mode, setMode, form, setForm } = useReferralModal();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
        const { data, error } = await supabase.from('doctors').select('*');
        if (error) throw error;
        return data;
    },
    enabled: open && mode === 'full',
  });
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
        const { data, error } = await supabase.from('vendors').select('*');
        if (error) throw error;
        return data;
    },
    enabled: open && mode === 'full',
  });

  const getOrCreateProviderId = async (name: string): Promise<string | null> => {
    if (!name?.trim()) return null;
    const normalizedName = name.trim().toUpperCase();

    const { data: existing, error: findError } = await supabase
        .from('insurance_providers')
        .select('id')
        .eq('name', normalizedName)
        .single();

    if (findError && findError.code !== 'PGRST116') throw findError;
    if (existing) return existing.id;

    const { data: created, error: createError } = await supabase
        .from('insurance_providers')
        .insert({ name: normalizedName, source: 'form' })
        .select('id')
        .single();
    
    if (createError) throw createError;
    toast(`New provider "${normalizedName}" added.`, 'ok');
    queryClient.invalidateQueries({ queryKey: ['insurance_providers'] });
    return created.id;
  };

  const saveQuick = async () => {
    if (!form.name?.trim() || !form.primary_insurance?.trim() || !form.stoplight_status) {
        toast('Patient Name, Insurance, and Stoplight Status are required.', 'err');
        return;
    }
    setIsSaving(true);
    try {
      const standardTemplate = docTemplates.find(t => t.id === 'standard_wc');
      const defaultRequiredDocs = standardTemplate ? standardTemplate.keys : [];
      
      const providerId = await getOrCreateProviderId(form.primary_insurance);

      const { data: newPatient, error: patientError } = await supabase.from('patients').insert({ 
        name: form.name, 
        primary_insurance: form.primary_insurance,
        insurance_provider_id: providerId,
        required_documents: defaultRequiredDocs,
        stoplight_status: form.stoplight_status,
      }).select().single();

      if (patientError) throw patientError;
      if (!newPatient) throw new Error("Patient creation failed.");
      
      const { error: orderError } = await supabase.from('orders').insert({ 
        patient_id: newPatient.id, 
        referral_source: form.referral_source, 
        workflow_stage: 'Referral Received', 
        status: 'Pending Intake', 
        rep_name: user?.email || 'System', 
        referral_date: new Date().toISOString(), 
        is_archived: false,
        stoplight_status: form.stoplight_status,
      });
      if (orderError) throw orderError;
      
      await writeAuditLog('patient_created_quick', { changed_by: user?.email, changed_user: newPatient.name, patient_id: newPatient.id });
      toast('Quick referral added!', 'ok');
      queryClient.invalidateQueries({ queryKey: ['referrals_direct_all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_orders_all'] });
      close();
    } catch (error: any) {
      console.error("Error saving quick referral:", error);
      toast(`Error: ${error.message}`, 'err');
    } finally {
      setIsSaving(false);
    }
  };

  const saveFull = async () => {
    if (!form.name?.trim() || !form.stoplight_status) {
        toast('Patient Name and Stoplight Status are required.', 'err');
        return;
    }
    setIsSaving(true);
    
    const {
        name, dob, gender, referring_physician, pcp_name, pcp_phone,
        phone_number, email, address_line1, address_line2, city, state, zip,
        preferred_contact_method, primary_insurance, required_documents,
        referral_source, referral_date, stoplight_status,
    } = form;

    const providerId = await getOrCreateProviderId(primary_insurance || '');

    const patientData: Partial<Patient> = {
        name, dob: dob || null, gender, referring_physician, pcp_name, pcp_phone,
        phone_number, email, address_line1, address_line2, city, state, zip,
        preferred_contact_method, primary_insurance, required_documents,
        insurance_provider_id: providerId,
        stoplight_status,
    };
    
    const initialDocStatus: Record<string, 'Missing' | 'Complete'> = {};
    if (required_documents) {
        (required_documents as DocKey[]).forEach(docKey => {
            initialDocStatus[docKey] = 'Missing';
        });
    }

    const orderData: Partial<Order> = {
        referral_source,
        document_status: initialDocStatus,
    };

    try {
        const { data: newPatient, error: patientError } = await supabase.from('patients').insert(patientData).select().single();
        if (patientError) throw patientError;
        if (!newPatient) throw new Error("Patient creation failed.");

        const finalOrderPayload = { ...orderData, patient_id: newPatient.id, workflow_stage: 'Referral Received', status: 'Pending Intake', rep_name: user?.email || 'System', referral_date: referral_date || new Date().toISOString(), is_archived: false, stoplight_status };
        const { error: orderError } = await supabase.from('orders').insert(finalOrderPayload);
        if (orderError) throw orderError;

        await writeAuditLog('patient_created', { changed_by: user?.email, changed_user: newPatient.name, patient_id: newPatient.id });
        toast('Referral saved successfully.', 'ok');
        queryClient.invalidateQueries({ queryKey: ['referrals_direct_all'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard_orders_all'] });
        close();
    } catch (error: any) {
        console.error("Error saving full referral:", error);
        toast(`Error: ${error.message}`, 'err');
    } finally {
      setIsSaving(false);
    }
  };

  const stoplightOptions = [
    { value: 'green', label: '🟢 Green (Ready)' },
    { value: 'yellow', label: '🟡 Yellow (Needs Review)' },
    { value: 'red', label: '🔴 Red (Blocked)' },
  ];

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={mode === 'quick' ? 'max-w-sm' : 'max-w-2xl'}>
        <DialogHeader>{mode === 'quick' ? 'Quick Add Referral' : 'Full Referral Form'}</DialogHeader>
        
        {mode === 'quick' ? (
          <>
            <div className="p-6 space-y-4">
              <Input
                label="Patient Name"
                value={form.name || ''}
                onChange={(e) => setForm({ name: e.target.value })}
                required
              />
              <SearchableSelect
                label="Primary Insurance"
                value={form.primary_insurance || ''}
                onChange={(newValue) => setForm({ primary_insurance: newValue })}
                isRecommended
              />
              <Select
                label="Referral Source"
                options={[{ value: 'Clinic', label: 'Clinic' }, { value: 'Other', label: 'Other' }]}
                value={form.referral_source || 'Clinic'}
                onChange={(e) => setForm({ referral_source: e.target.value })}
              />
              <Select
                label="Stoplight Status"
                options={stoplightOptions}
                value={form.stoplight_status || 'green'}
                onChange={(e) => setForm({ stoplight_status: e.target.value as 'green' | 'yellow' | 'red' })}
                required
              />
            </div>
            <DialogFooter>
                <Button className="w-full" onClick={saveQuick} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Referral
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setMode("full")}
                >
                  Expand to Full Form
                </Button>
                <Button variant="ghost" className="w-full" onClick={close}>Cancel</Button>
            </DialogFooter>
          </>
        ) : (
          <FullReferralForm
            value={form}
            onChange={setForm}
            onBack={() => setMode("quick")}
            onSubmit={saveFull}
            doctors={doctors}
            vendors={vendors}
            isSaving={isSaving}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
