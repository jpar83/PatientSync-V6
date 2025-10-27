import React, { useState } from 'react';
import { useConvertLeadModal } from "@/state/useConvertLeadModal";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { Loader2 } from 'lucide-react';
import type { Vendor, Patient } from '@/lib/types';

export default function ConvertLeadModal() {
  const { isOpen, closeModal, lead } = useConvertLeadModal();
  const queryClient = useQueryClient();
  const [conversionType, setConversionType] = useState<'vendor' | 'account'>('vendor');
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!lead) return;
    setIsConverting(true);
    
    try {
      let refId: string | null = null;
      
      if (conversionType === 'vendor') {
        const { data: existingVendor } = await supabase.from('vendors').select('id').eq('name', lead.name).single();
        if (existingVendor) {
          refId = existingVendor.id;
        } else {
          const { data: newVendor, error } = await supabase.from('vendors').insert({ name: lead.name, address: lead.full_address }).select('id').single();
          if (error) throw error;
          refId = newVendor.id;
          toast('New vendor created.', 'ok');
        }
      } else { // 'account' -> creating a patient
        const { data: existingPatient } = await supabase.from('patients').select('id').eq('name', lead.name).single();
        if (existingPatient) {
          refId = existingPatient.id;
        } else {
          const { data: newPatient, error } = await supabase.from('patients').insert({ name: lead.name, address_line1: lead.street, city: lead.city, state: lead.state, zip: lead.zip }).select('id').single();
          if (error) throw error;
          refId = newPatient.id;
          toast('New patient record created.', 'ok');
        }
      }

      const { error: leadUpdateError } = await supabase.from('marketing_leads').update({
        converted_to: conversionType,
        converted_ref_id: refId,
        lead_status: 'Active'
      }).eq('id', lead.id);

      if (leadUpdateError) throw leadUpdateError;

      toast(`Lead converted to ${conversionType}.`, 'ok');
      queryClient.invalidateQueries({ queryKey: ['marketing_leads'] });
      closeModal();
    } catch (error: any) {
      toast(`Conversion failed: ${error.message}`, 'err');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>Convert Lead: {lead?.name}</DialogHeader>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">Convert this lead into a new record. This will mark the lead as converted and link it to the new entry.</p>
          <RadioGroup value={conversionType} onValueChange={(value) => setConversionType(value as 'vendor' | 'account')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="vendor" id="r-vendor" />
              <Label htmlFor="r-vendor">Vendor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="account" id="r-account" />
              <Label htmlFor="r-account">Account (Patient)</Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeModal} disabled={isConverting}>Cancel</Button>
          <Button onClick={handleConvert} disabled={isConverting}>
            {isConverting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Convert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
