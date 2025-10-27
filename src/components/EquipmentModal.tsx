import React from 'react';
import { useEquipmentModal } from "@/state/useEquipmentModal";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { Loader2 } from 'lucide-react';
import { equipmentTypeOptions, equipmentStatusOptions } from '@/lib/formConstants';
import type { Vendor } from '@/lib/types';
import { Textarea } from './ui/Textarea';

const equipmentCategoryOptions = [
    { value: 'Wheelchair', label: 'Wheelchair' },
    { value: 'Power Wheelchair', label: 'Power Wheelchair' },
    { value: 'Scooter', label: 'Scooter' },
    { value: 'Seating', label: 'Seating' },
    { value: 'Respiratory', label: 'Respiratory' },
    { value: 'Wound', label: 'Wound' },
    { value: 'Other', label: 'Other' },
];

export default function EquipmentModal() {
  const { isOpen, closeModal, form, setForm, editingEquipment, orderId } = useEquipmentModal();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = React.useState(false);

  const { data: vendors = [] } = useQuery<Vendor[]>({
      queryKey: ['vendors'],
      queryFn: async () => {
          const { data, error } = await supabase.from('vendors').select('*');
          if (error) throw error;
          return data;
      }
  });

  const vendorOptions = vendors.map(v => ({ value: v.id, label: v.name }));

  const handleSave = async () => {
    if (!form.equipment_type) {
      toast('Equipment type is required.', 'err');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...form, order_id: orderId };
      if (editingEquipment) {
        const { error } = await supabase.from('equipment').update(payload).eq('id', editingEquipment.id);
        if (error) throw error;
        toast('Equipment record updated.', 'ok');
      } else {
        const { error } = await supabase.from('equipment').insert(payload);
        if (error) throw error;
        toast('Equipment record added.', 'ok');
      }
      queryClient.invalidateQueries({ queryKey: ['equipment', orderId] });
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
        <DialogHeader>{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</DialogHeader>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Category" options={equipmentCategoryOptions} value={form.category || ''} onChange={e => setForm({ category: e.target.value as any })} wrapperClassName="sm:col-span-2" />
          <Select label="Equipment Type" options={equipmentTypeOptions} value={form.equipment_type || ''} onChange={e => setForm({ equipment_type: e.target.value })} required />
          <Input label="Model/SKU" value={form.model || ''} onChange={e => setForm({ model: e.target.value })} />
          <Input label="Serial Number" value={form.serial_number || ''} onChange={e => setForm({ serial_number: e.target.value })} />
          <Select label="Vendor" options={vendorOptions} value={form.vendor_id || ''} onChange={e => setForm({ vendor_id: e.target.value })} />
          <Input type="date" label="Date Delivered" value={form.date_delivered || ''} onChange={e => setForm({ date_delivered: e.target.value })} />
          <Select label="Status" options={equipmentStatusOptions} value={form.status || ''} onChange={e => setForm({ status: e.target.value })} />
          <Textarea label="Notes" value={form.notes || ''} onChange={e => setForm({ notes: e.target.value })} wrapperClassName="sm:col-span-2" rows={2} />
          
          <div className="sm:col-span-2 border-t pt-4 mt-2 space-y-4">
            <Checkbox label="Item has been returned" checked={form.is_returned || false} onChange={e => setForm({ is_returned: e.target.checked })} />
            {form.is_returned && (
              <Input type="date" label="Date Returned" value={form.date_returned || ''} onChange={e => setForm({ date_returned: e.target.value })} />
            )}
            <Checkbox label="Item has been repaired" checked={form.is_repaired || false} onChange={e => setForm({ is_repaired: e.target.checked })} />
            {form.is_repaired && (
              <Input type="date" label="Date Repaired" value={form.date_repaired || ''} onChange={e => setForm({ date_repaired: e.target.value })} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingEquipment ? 'Save Changes' : 'Add Equipment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
