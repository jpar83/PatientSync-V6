import React from 'react';
import { useDenialModal } from "@/state/useDenialModal";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { Checkbox } from './ui/Checkbox';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { Loader2 } from 'lucide-react';
import { denialReasonOptions, appealOutcomeOptions } from '@/lib/formConstants';
import workflowData from '../../schemas/workflow.json';

const stageOptions = workflowData.workflow.map(s => ({ value: s.stage, label: s.stage }));

export default function DenialModal() {
  const { isOpen, closeModal, form, setForm, editingDenial, orderId } = useDenialModal();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (!form.reason_text || !form.notes?.trim()) {
      toast('Denial reason and notes are required.', 'err');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...form, order_id: orderId };
      if (editingDenial) {
        const { error } = await supabase.from('denials').update(payload).eq('id', editingDenial.id);
        if (error) throw error;
        toast('Denial record updated.', 'ok');
      } else {
        const { error } = await supabase.from('denials').insert(payload);
        if (error) throw error;
        toast('Denial record added.', 'ok');
      }
      queryClient.invalidateQueries({ queryKey: ['denials', orderId] });
      queryClient.invalidateQueries({ queryKey: ['patient_details', form.patient_id] });
      closeModal();
    } catch (error: any) {
      toast(`Error: ${error.message}`, 'err');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-lg">
        <DialogHeader>Denials & Appeals</DialogHeader>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input type="date" label="Denial Date" value={form.denial_date || ''} onChange={(e) => setForm({ denial_date: e.target.value })} required />
          <Input label="Payer" value={form.payer || ''} onChange={(e) => setForm({ payer: e.target.value })} placeholder="e.g., UHC" />
          <Select label="Denial Reason" options={denialReasonOptions} value={form.reason_text || ''} onChange={(e) => setForm({ reason_text: e.target.value })} required wrapperClassName="sm:col-span-2" />
          <Input label="Reason Code" value={form.reason_code || ''} onChange={(e) => setForm({ reason_code: e.target.value })} placeholder="e.g., M81" />
          <Select label="Stage at Denial" options={stageOptions} value={form.stage_at_denial || ''} onChange={(e) => setForm({ stage_at_denial: e.target.value })} />
          <Textarea label="Notes" value={form.notes || ''} onChange={(e) => setForm({ notes: e.target.value })} placeholder="Required: Add details about the denial..." required wrapperClassName="sm:col-span-2" />
          <div className="sm:col-span-2 border-t pt-4 mt-2 space-y-4">
            <Checkbox label="Appeal Filed?" checked={form.appeal_filed || false} onChange={(e) => setForm({ appeal_filed: e.target.checked })} />
            {form.appeal_filed && (
              <>
                <Input type="date" label="Appeal Date" value={form.appeal_date || ''} onChange={(e) => setForm({ appeal_date: e.target.value })} />
                <Select label="Appeal Outcome" options={appealOutcomeOptions} value={form.appeal_outcome || 'Pending'} onChange={(e) => setForm({ appeal_outcome: e.target.value })} />
              </>
            )}
             <Checkbox label="Resolved?" checked={form.resolved || false} onChange={(e) => setForm({ resolved: e.target.checked })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingDenial ? 'Save Changes' : 'Log denial'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
