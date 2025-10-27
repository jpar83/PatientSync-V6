import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface DailyActivityCounts {
  new_denials: number;
  docs_completed: number;
  newly_archived: number;
}

export const useDailyActivity = () => {
  return useQuery<DailyActivityCounts>({
    queryKey: ['daily_activity_counts'],
    queryFn: async () => {
      // Corrected function name based on the database error hint
      const { data, error } = await supabase.rpc('get_recent_activity');
      if (error) {
        console.error('Error fetching daily activity counts:', error);
        // Return zeros on error to prevent crashing the UI
        return { new_denials: 0, docs_completed: 0, newly_archived: 0 };
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
