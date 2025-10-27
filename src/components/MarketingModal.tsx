import React, { useState, useEffect } from 'react';
import { useMarketingModal, MarketingModalMode } from "@/state/useMarketingModal";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/button';
import { Textarea } from './ui/Textarea';
import { Checkbox } from './ui/Checkbox';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { usStates, touchpointPurposeOptions } from '@/lib/formConstants';
import type { LeadStatus, TouchpointType, InServiceStatus, MarketingLead, MarketingEventType } from '@/lib/types';
import LeadSearchableSelect from './ui/LeadSearchableSelect';
import AccordionSection from './ui/AccordionSection';
import { marketingEventTypeOptions } from '@/lib/formConstants';

const leadTypeOptions = [
    { value: 'Clinic', label: 'Clinic' }, { value: 'Hospital', label: 'Hospital' },
    { value: 'SNF', label: 'Skilled Nursing Facility' }, { value: 'PCP', label: 'Primary Care Provider' },
    { value: 'DME', label: 'DME Company' }, { value: 'Other', label: 'Other' },
];
const leadStatusOptions: { value: LeadStatus, label: string }[] = [
    { value: 'Prospect', label: 'Prospect' }, { value: 'Warm', label: 'Warm' },
    { value: 'Active', label: 'Active' }, { value: 'Dormant', label: 'Dormant' }, { value: 'Lost', label: 'Lost' },
];
const touchpointTypeOptions: { value: TouchpointType, label: string }[] = [
    { value: 'Call', label: 'Phone Call' }, { value: 'Email', label: 'Email' },
    { value: 'Drop-in', label: 'Drop-in' }, { value: 'Meeting', label: 'Meeting' },
    { value: 'In-Service', label: 'In-Service' }, { value: 'Other', label: 'Other' },
];
const touchpointOutcomeOptions = [
    { value: 'Positive', label: 'Positive' }, { value: 'Neutral', label: 'Neutral' },
    { value: 'Negative', label: 'Negative' }, { value: 'No response', label: 'No Response' },
];
const inServiceStatusOptions: { value: InServiceStatus, label: string }[] = [
    { value: 'Planned', label: 'Planned' }, { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Done', label: 'Done' }, { value: 'Cancelled', label: 'Cancelled' },
];

export default function MarketingModal() {
    const { isOpen, closeModal, mode, form, setForm, editingId, originalForm } = useMarketingModal();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [isManualLeadEntry, setIsManualLeadEntry] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsManualLeadEntry(!form.lead_id && !!form.manualLeadName);
        }
    }, [isOpen, form.lead_id, form.manualLeadName]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (mode === 'lead' && !form.name?.trim()) {
                throw new Error('Lead Name is required.');
            }
            if (mode === 'event' || mode === 'touchpoint') {
                if (!isManualLeadEntry && !form.lead_id) {
                    throw new Error('A lead must be selected.');
                }
                if (isManualLeadEntry && !form.manualLeadName?.trim()) {
                    throw new Error('Manual lead name is required.');
                }
            }
            if (mode === 'event' && !form.start_at) {
                throw new Error('Start Time is required for an event.');
            }
            const handler = editingId ? handleUpdate : handleCreate;
            await handler();
            queryClient.invalidateQueries({ queryKey: ['marketing_leads'] });
            queryClient.invalidateQueries({ queryKey: ['marketing_touchpoints'] });
            queryClient.invalidateQueries({ queryKey: ['marketing_in_services'] });
            closeModal();
        } catch (error: any) {
            toast(`Error: ${error.message}`, 'err');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = async () => {
        switch (mode) {
            case 'lead': {
                const createPayload = {
                    name: form.name, type: form.type, street: form.street, suite: form.suite,
                    city: form.city, state: form.state, zip: form.zip, phone: form.phone,
                    phone_extension: form.phone_extension, lead_status: form.lead_status,
                    notes: form.notes, owner_id: user?.id,
                };
                const { data, error } = await supabase.from('marketing_leads').insert(createPayload).select().single();
                if (error) throw error;
                toast('New lead added!', 'ok');
                break;
            }
            case 'touchpoint': {
                let leadIdForTouchpoint = form.lead_id;

                if (isManualLeadEntry) {
                    if (!form.manualLeadName?.trim()) throw new Error("Manual lead name cannot be empty.");
                    
                    const { data: newLead, error: leadError } = await supabase.from('marketing_leads').insert({
                        name: form.manualLeadName.trim(),
                        type: 'Other',
                        lead_status: 'Prospect',
                        notes: 'Placeholder created from touchpoint logging.',
                        owner_id: user?.id,
                    }).select('id').single();
                    
                    if (leadError) throw leadError;
                    
                    leadIdForTouchpoint = newLead.id;
                    toast('Placeholder lead created.', 'ok');
                    queryClient.invalidateQueries({ queryKey: ['marketing_leads_search'] });
                }

                if (!leadIdForTouchpoint) throw new Error("A lead must be selected or created.");

                const touchpointPayload = {
                    lead_id: leadIdForTouchpoint, user_id: user?.id, type: form.type,
                    purpose: form.purpose, notes: form.notes, outcome: form.outcome,
                    follow_up_at: form.follow_up_at || null, occurred_at: new Date().toISOString(),
                };
                await supabase.from('marketing_touchpoints').insert(touchpointPayload).select().single();
                const leadUpdatePayload: { last_contacted_at: string; next_action_at?: string } = { last_contacted_at: new Date().toISOString() };
                if (form.follow_up_at) leadUpdatePayload.next_action_at = form.follow_up_at;
                await supabase.from('marketing_leads').update(leadUpdatePayload).eq('id', leadIdForTouchpoint);
                toast('Journal entry logged!', 'ok');
                break;
            }
            case 'event': {
                let leadIdForEvent = form.lead_id;
                if (isManualLeadEntry) {
                    const { data: newLead, error: phError } = await supabase.from('marketing_leads').insert({
                        name: form.manualLeadName.trim(), type: 'Other', lead_status: 'Prospect',
                        notes: 'Placeholder created from event scheduling.', owner_id: user?.id,
                        street: form.street, city: form.city, state: form.state, zip: form.zip, phone: form.phone,
                    }).select('id').single();
                    if (phError) throw phError;
                    leadIdForEvent = newLead.id;
                    toast('Placeholder lead created.', 'ok');
                    queryClient.invalidateQueries({ queryKey: ['marketing_leads_search'] });
                }

                const eventPayload = {
                    lead_id: leadIdForEvent, user_id: user?.id, event_type: form.event_type,
                    topic: form.topic, date_time: form.start_at, start_at: form.start_at,
                    end_at: form.end_at || null, location: form.location, status: form.status,
                    notes: form.notes, assigned_to: form.assigned_to || null, attendees: form.attendees || null,
                };
                await supabase.from('marketing_in_services').insert(eventPayload).select().single();
                toast('Event scheduled!', 'ok');
                break;
            }
        }
    };
    
    const handleUpdate = async () => {
        if (!editingId || !originalForm) return;

        let changes: Record<string, any> = {};
        for (const key in form) {
            if (form.hasOwnProperty(key) && form[key] !== originalForm[key]) {
                if (key !== 'lead_name' && key !== 'manualLeadName' && key !== 'marketing_leads') {
                    changes[key] = form[key];
                }
            }
        }

        if (Object.keys(changes).length === 0) {
            toast('No changes detected.', 'ok');
            closeModal();
            return;
        }

        let tableName: string;
        switch (mode) {
            case 'lead': tableName = 'marketing_leads'; break;
            case 'touchpoint': tableName = 'marketing_touchpoints'; break;
            case 'event': tableName = 'marketing_in_services'; break;
            default: throw new Error('Invalid mode for update');
        }

        const { error } = await supabase.from(tableName).update(changes).eq('id', editingId);
        if (error) throw error;
        toast(`${mode.charAt(0).toUpperCase() + mode.slice(1)} updated successfully!`, 'ok');
    };

    const renderContent = () => {
        const title = `${editingId ? 'Edit' : 'Add'} ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
        const saveButtonText = `${editingId ? 'Save Changes' : `Add ${mode === 'touchpoint' ? 'Entry' : mode.charAt(0).toUpperCase() + mode.slice(1)}`}`;
        
        switch(mode) {
            case 'lead':
                return (
                    <>
                        <DialogHeader>{title}</DialogHeader>
                        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                            <AccordionSection title="Lead Information">
                                <div className="space-y-4 pt-3">
                                    <Input label="Lead/Organization Name" value={form.name || ''} onChange={(e) => setForm({ name: e.target.value })} required />
                                    <Select label="Lead Type" options={leadTypeOptions} value={form.type || ''} onChange={(e) => setForm({ type: e.target.value })} />
                                    <Select label="Lead Status" options={leadStatusOptions} value={form.lead_status || ''} onChange={(e) => setForm({ lead_status: e.target.value })} />
                                </div>
                            </AccordionSection>
                            <AccordionSection title="Contact & Address">
                                <div className="space-y-4 pt-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Phone" value={form.phone || ''} onChange={(e) => setForm({ phone: e.target.value })} />
                                        <Input label="Extension" value={form.phone_extension || ''} onChange={(e) => setForm({ phone_extension: e.target.value })} />
                                    </div>
                                    <Input label="Street" value={form.street || ''} onChange={(e) => setForm({ street: e.target.value })} />
                                    <Input label="Suite/Apt" value={form.suite || ''} onChange={(e) => setForm({ suite: e.target.value })} />
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input label="City" value={form.city || ''} onChange={(e) => setForm({ city: e.target.value })} wrapperClassName="col-span-2" />
                                        <Select label="State" options={usStates} value={form.state || ''} onChange={(e) => setForm({ state: e.target.value })} />
                                    </div>
                                    <Input label="ZIP Code" value={form.zip || ''} onChange={(e) => setForm({ zip: e.target.value })} />
                                </div>
                            </AccordionSection>
                            <AccordionSection title="Notes">
                                <div className="pt-3">
                                    <Textarea label="Notes" value={form.notes || ''} onChange={(e) => setForm({ notes: e.target.value })} rows={4} />
                                </div>
                            </AccordionSection>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeModal}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {saveButtonText}
                            </Button>
                        </DialogFooter>
                    </>
                );
            case 'touchpoint':
                return (
                    <>
                        <DialogHeader>{title}</DialogHeader>
                        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                            <Checkbox
                                label="Manually enter a new lead"
                                description="Creates a placeholder lead to be detailed later."
                                checked={isManualLeadEntry}
                                onChange={(e) => {
                                    setIsManualLeadEntry(e.target.checked);
                                    if (e.target.checked) setForm({ lead_id: '' });
                                    else setForm({ manualLeadName: '' });
                                }}
                            />
                            {isManualLeadEntry ? (
                                <Input label="New Lead Name" value={form.manualLeadName || ''} onChange={(e) => setForm({ manualLeadName: e.target.value })} required />
                            ) : (
                                <LeadSearchableSelect 
                                    label="Lead" 
                                    value={form.lead_id || ''} 
                                    onChange={(lead) => setForm({ lead_id: lead?.id || '' })}
                                    onManualEntryRequest={(searchTerm) => {
                                        setIsManualLeadEntry(true);
                                        setForm({ manualLeadName: searchTerm, lead_id: '' });
                                    }}
                                    isRecommended 
                                />
                            )}
                            <Select label="Interaction Type" options={touchpointTypeOptions} value={form.type || ''} onChange={(e) => setForm({ type: e.target.value })} required />
                            <Select label="Purpose" options={touchpointPurposeOptions} value={form.purpose || ''} onChange={(e) => setForm({ purpose: e.target.value })} required />
                            <Select label="Outcome" options={touchpointOutcomeOptions} value={form.outcome || ''} onChange={(e) => setForm({ outcome: e.target.value })} />
                            <Textarea label="Notes" value={form.notes || ''} onChange={(e) => setForm({ notes: e.target.value })} rows={3} />
                            <Input label="Follow-up Date (Optional)" type="date" value={form.follow_up_at ? new Date(form.follow_up_at).toISOString().split('T')[0] : ''} onChange={(e) => setForm({ follow_up_at: e.target.value })} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeModal}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {saveButtonText}
                            </Button>
                        </DialogFooter>
                    </>
                );
            case 'event': {
                const showAttendees = ['In-Service', 'Training', 'Community', 'Meeting'].includes(form.event_type);
                const showAssignedTo = ['Repair', 'Delivery', 'Pickup'].includes(form.event_type);

                return (
                  <>
                      <DialogHeader>{title}</DialogHeader>
                      <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                          <AccordionSection title="Event Details">
                            <div className="space-y-4 pt-3">
                                <Select label="Event Type" options={marketingEventTypeOptions} value={form.event_type || 'In-Service'} onChange={(e) => setForm({ event_type: e.target.value })} required />
                                <Input label="Topic / Title" value={form.topic || ''} onChange={(e) => setForm({ topic: e.target.value })} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Start Time" type="datetime-local" value={form.start_at ? new Date(form.start_at).toISOString().substring(0, 16) : ''} onChange={(e) => setForm({ start_at: e.target.value, date_time: e.target.value })} required />
                                    <Input label="End Time (Optional)" type="datetime-local" value={form.end_at ? new Date(form.end_at).toISOString().substring(0, 16) : ''} onChange={(e) => setForm({ end_at: e.target.value })} />
                                </div>
                                <Select label="Status" options={inServiceStatusOptions} value={form.status || 'Planned'} onChange={(e) => setForm({ status: e.target.value as InServiceStatus })} />
                                {showAttendees && <Input type="number" label="Attendees" value={form.attendees || ''} onChange={(e) => setForm({ attendees: parseInt(e.target.value) || null })} />}
                                {showAssignedTo && <Input label="Assigned To" value={form.assigned_to || ''} onChange={(e) => setForm({ assigned_to: e.target.value })} placeholder="User ID or name" />}
                                <Textarea label="Notes" value={form.notes || ''} onChange={(e) => setForm({ notes: e.target.value })} rows={2} />
                            </div>
                          </AccordionSection>
                          <AccordionSection title="Lead Details">
                            <div className="space-y-4 pt-3">
                                <Checkbox
                                    label="Manually enter a new lead"
                                    description="Creates a placeholder lead to be detailed later."
                                    checked={isManualLeadEntry}
                                    onChange={(e) => {
                                        setIsManualLeadEntry(e.target.checked);
                                        if (e.target.checked) setForm({ lead_id: '' });
                                        else setForm({ manualLeadName: '' });
                                    }}
                                />
                                {isManualLeadEntry ? (
                                    <Input label="New Lead Name" value={form.manualLeadName || ''} onChange={(e) => setForm({ manualLeadName: e.target.value })} required />
                                ) : (
                                    <LeadSearchableSelect 
                                        label="Lead" 
                                        value={form.lead_id || ''} 
                                        onChange={(lead) => {
                                            if (lead) {
                                                setForm({ 
                                                    lead_id: lead.id, 
                                                    location: lead.full_address || '', 
                                                    street: lead.street || '',
                                                    city: lead.city || '',
                                                    state: lead.state || '',
                                                    zip: lead.zip || '',
                                                    phone: lead.phone || '',
                                                });
                                            } else {
                                                setForm({ lead_id: '', location: '', street: '', city: '', state: '', zip: '', phone: '' });
                                            }
                                        }}
                                        onManualEntryRequest={(searchTerm) => {
                                            setIsManualLeadEntry(true);
                                            setForm({ manualLeadName: searchTerm, lead_id: '' });
                                        }}
                                        isRecommended 
                                    />
                                )}
                                <Input label="Location" value={form.location || ''} onChange={(e) => setForm({ location: e.target.value })} placeholder="Prefills from lead address" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Street" value={form.street || ''} onChange={(e) => setForm({ street: e.target.value })} />
                                    <Input label="Phone" value={form.phone || ''} onChange={(e) => setForm({ phone: e.target.value })} />
                                    <Input label="City" value={form.city || ''} onChange={(e) => setForm({ city: e.target.value })} />
                                    <Select label="State" options={usStates} value={form.state || ''} onChange={(e) => setForm({ state: e.target.value })} />
                                    <Input label="ZIP" value={form.zip || ''} onChange={(e) => setForm({ zip: e.target.value })} />
                                </div>
                            </div>
                          </AccordionSection>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {saveButtonText}
                        </Button>
                      </DialogFooter>
                  </>
                );
            }
            default: return <div className="p-6">Coming soon...</div>;
        }
    };

    return (
      <Dialog open={isOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl">
              {renderContent()}
          </DialogContent>
      </Dialog>
    );
}
