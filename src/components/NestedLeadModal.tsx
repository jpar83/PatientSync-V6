import React, { useState, useEffect } from 'react';
import { useNestedLeadModal } from '@/state/useNestedLeadModal';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Button } from './ui/button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { Loader2 } from 'lucide-react';
import type { MarketingLead } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';

const leadTypeOptions = [
    { value: 'Clinic', label: 'Clinic' }, { value: 'Hospital', label: 'Hospital' },
    { value: 'SNF', label: 'Skilled Nursing Facility' }, { value: 'PCP', label: 'Primary Care Provider' },
    { value: 'DME', label: 'DME Company' }, { value: 'Other', label: 'Other' },
];

export default function NestedLeadModal() {
  const { isOpen, closeModal, initialName, onSaveSuccess } = useNestedLeadModal();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState('Clinic');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setType('Clinic'); // Reset type on open
    }
  }, [isOpen, initialName]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast('Lead name is required.', 'err');
      return;
    }
    setIsSaving(true);
    try {
      const { data: newLead, error } = await supabase.from('marketing_leads').insert({
        name: name.trim(),
        type,
        owner_id: user?.id,
        lead_status: 'Prospect',
      }).select().single();

      if (error) throw error;

      toast('New lead created.', 'ok');
      if (onSaveSuccess) {
        onSaveSuccess(newLead as MarketingLead);
      }
      queryClient.invalidateQueries({ queryKey: ['marketing_leads'] });
      queryClient.invalidateQueries({ queryKey: ['marketing_leads_search'] });
      closeModal();
    } catch (error: any) {
      toast(`Error creating lead: ${error.message}`, 'err');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>Create New Lead</DialogHeader>
        <div className="p-6 space-y-4">
          <Input
            label="Lead/Organization Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Select
            label="Lead Type"
            options={leadTypeOptions}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeModal} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create and Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
