import React, { useState } from 'react';
import { useProviderModal } from "@/state/useProviderModal";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { Loader2 } from 'lucide-react';

export default function AddProviderModal() {
  const { isOpen, closeModal } = useProviderModal();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast('Provider name is required.', 'err');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('insurance_providers').insert({ name: name.trim() });
      if (error) throw error;
      toast('Insurance provider added.', 'ok');
      queryClient.invalidateQueries({ queryKey: ['insurance_providers'] });
      queryClient.invalidateQueries({ queryKey: ['account_overview_with_all_providers'] });
      setName('');
      closeModal();
    } catch (error: any) {
      toast(`Error: ${error.message}`, 'err');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    closeModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>Add Insurance Provider</DialogHeader>
        <div className="p-6">
          <Input
            label="Provider Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
