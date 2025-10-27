import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { PatientNote } from '@/lib/types';

export function useLatestNote(patientId: string) {
  return useQuery({
    queryKey: ['latest_patient_note', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_notes')
        .select('*, profiles(full_name)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Ignore "no rows found"
        throw error;
      }
      return data as PatientNote | null;
    },
    enabled: !!patientId,
  });
}
