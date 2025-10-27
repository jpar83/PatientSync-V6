import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { writeAuditLog } from '@/lib/auditLogger';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Loader2 } from 'lucide-react';
import { StoplightBadge } from './ui/StoplightBadge';

type StoplightStatus = 'green' | 'yellow' | 'red';

interface StoplightStatusControlProps {
  orderId: string;
  patientId: string;
  currentStatus: StoplightStatus | null | undefined;
  onUpdate: () => void;
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<StoplightStatus, { label: string; color: StoplightStatus; tooltip: string; }> = {
  green: { label: 'Green', color: 'green', tooltip: 'Good to Go' },
  yellow: { label: 'Yellow', color: 'yellow', tooltip: 'Risk / Needs Review' },
  red: { label: 'Red', color: 'red', tooltip: 'Declined / Stop' },
};

const StoplightStatusControl: React.FC<StoplightStatusControlProps> = ({ orderId, patientId, currentStatus, onUpdate, showLabel = true, className }) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newStatus: StoplightStatus) => {
      const updates = [
        supabase.from('orders').update({ stoplight_status: newStatus }).eq('id', orderId),
        supabase.from('patients').update({ stoplight_status: newStatus }).eq('id', patientId),
      ];
      const results = await Promise.all(updates);
      results.forEach(res => {
        if (res.error) throw res.error;
      });
      return newStatus;
    },
    onSuccess: (newStatus) => {
      writeAuditLog('stoplight_update', {
        patient_id: patientId,
        details: { from: currentStatus, to: newStatus, reason: 'Manual Change' },
      });
      toast(`Status updated to ${statusConfig[newStatus].label}`, 'ok');
      onUpdate();
    },
    onError: (error: any) => {
      toast(`Failed to update status: ${error.message}`, 'err');
    },
  });

  const currentConfig = statusConfig[currentStatus || 'green'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id={showLabel ? "tour-stoplight-changer" : undefined}
          className={cn("flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors", className)}
          title={currentConfig.tooltip}
          aria-label={`Current status: ${currentConfig.tooltip}. Click to change.`}
        >
          <StoplightBadge color={currentConfig.color} />
          {showLabel && <span className="text-xs font-semibold text-muted">{currentConfig.label}</span>}
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.entries(statusConfig).map(([key, { label, color }]) => (
          <DropdownMenuItem key={key} onClick={() => mutation.mutate(key as StoplightStatus)} disabled={currentStatus === key}>
            <StoplightBadge color={color as StoplightStatus} className="mr-2" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StoplightStatusControl;
