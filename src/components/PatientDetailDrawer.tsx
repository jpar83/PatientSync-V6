import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import SlideOver from './ui/SlideOver';
import { Btn } from './ui/Btn';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { writeAuditLog } from '../lib/auditLogger';
import { useAuth } from '../contexts/AuthContext';
import type { Order } from '../lib/types';
import { toast } from '../lib/toast';
import { cn } from '../lib/utils';
import DynamicDocChecklist from './DynamicDocChecklist';

const Read: React.FC<{ label: string; v: React.ReactNode; span?: boolean }> = ({ label, v, span }) => (
    <div className={cn(span ? 'col-span-2' : '')}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 break-words">{v || '—'}</dd>
    </div>
);

const PatientDetailDrawer: React.FC<{ order: Order | null; onClose: () => void; onUpdate: () => void; }> = ({ order, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formState, setFormState] = useState({
    name: '', dob: '', phone: '', email: '', address: '', city: '', state: '', zip: '',
    primary_ins: '', policy_no: '', notes: ''
  });

  useEffect(() => {
    if (order?.patients) {
      const p = order.patients;
      setFormState({
        name: p.name ?? '',
        dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
        phone: p.phone_number ?? '',
        email: p.email ?? '',
        address: p.address_line1 ?? '',
        city: p.city ?? '',
        state: p.state ?? '',
        zip: p.zip ?? '',
        primary_ins: p.primary_insurance ?? '',
        policy_no: p.policy_number ?? '',
        notes: p.insurance_notes ?? '',
      });
    }
  }, [order]);

  const handleInputChange = (key: keyof typeof formState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form state to original values from the prop
    if (order?.patients) {
        const p = order.patients;
        setFormState({
            name: p.name ?? '',
            dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
            phone: p.phone_number ?? '',
            email: p.email ?? '',
            address: p.address_line1 ?? '',
            city: p.city ?? '',
            state: p.state ?? '',
            zip: p.zip ?? '',
            primary_ins: p.primary_insurance ?? '',
            policy_no: p.policy_number ?? '',
            notes: p.insurance_notes ?? '',
        });
    }
  };

  const handleSave = async () => {
    if (!order?.patients) return;

    setIsSaving(true);
    const p = order.patients;

    const payload = {
        name: formState.name?.trim() || null,
        dob: formState.dob?.trim() || null,
        phone_number: formState.phone?.trim() || null,
        email: formState.email?.trim() || null,
        address_line1: formState.address?.trim() || null,
        city: formState.city?.trim() || null,
        state: formState.state?.trim() || null,
        zip: formState.zip?.trim() || null,
        primary_insurance: formState.primary_ins?.trim() || null,
        policy_number: formState.policy_no?.trim() || null,
        insurance_notes: formState.notes?.trim() || null,
    };

    try {
      const { error } = await supabase.from('patients').update(payload).eq('id', p.id);
      if (error) throw error;

      await writeAuditLog('patient_update', {
          changed_by: user?.email,
          changed_user: p.name,
          patient_id: p.id,
          details: { fields: Object.keys(payload) }
      });
      
      toast('Patient details saved successfully.', 'ok');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to save patient details:", error);
      toast('Failed to save patient details.', 'err');
    } finally {
      setIsSaving(false);
    }
  };

  const p = order?.patients;
  if (!order || !p) return null;

  return (
    <SlideOver isOpen={!!order} onClose={onClose} title="Patient & Order Details">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{p.name || 'Patient Details'}</h3>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Btn variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Btn>
            ) : (
              <>
                <Btn variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Btn>
                <Btn size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Saving…' : 'Save'}
                </Btn>
              </>
            )}
          </div>
        </div>

        {!isEditing ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <Read label="Date of Birth" v={p.dob ? new Date(p.dob).toLocaleDateString() : '—'} />
            <Read label="Phone" v={p.phone_number} />
            <Read label="Email" v={p.email} />
            <Read label="Address" v={p.address_line1} />
            <Read label="City" v={p.city} />
            <Read label="State" v={p.state} />
            <Read label="Zip" v={p.zip} />
            <Read label="Primary Ins." v={p.primary_insurance} />
            <Read label="Policy #" v={p.policy_number} />
            <Read label="Notes" v={p.insurance_notes} span />
          </dl>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="DOB" type="date" value={formState.dob} onChange={handleInputChange('dob')} />
            <Input label="Phone" value={formState.phone} onChange={handleInputChange('phone')} />
            <Input label="Email" value={formState.email} onChange={handleInputChange('email')} />
            <Input label="Address" value={formState.address} onChange={handleInputChange('address')} />
            <Input label="City" value={formState.city} onChange={handleInputChange('city')} />
            <Input label="State" value={formState.state} onChange={handleInputChange('state')} />
            <Input label="Zip" value={formState.zip} onChange={handleInputChange('zip')} />
            <Input label="Primary Ins." value={formState.primary_ins} onChange={handleInputChange('primary_ins')} />
            <Input label="Policy #" value={formState.policy_no} onChange={handleInputChange('policy_no')} />
            <Textarea label="Notes" value={formState.notes} onChange={handleInputChange('notes')} rows={3} wrapperClassName="sm:col-span-2" />
          </div>
        )}
        
        <div className="border-t pt-6">
            <DynamicDocChecklist order={order} onUpdate={onUpdate} />
        </div>
      </div>
    </SlideOver>
  );
};

export default PatientDetailDrawer;
