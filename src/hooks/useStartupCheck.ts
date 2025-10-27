import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useStartupCheck() {
  const params = new URLSearchParams(window.location.search);
  const safe = params.get('safe') === '1' || import.meta.env.VITE_SAFE_MODE === '1';

  const [status, setStatus] = useState<'checking'|'ok'|'degraded'|'error'>('checking');
  const [detail, setDetail] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    
    const performHealthCheck = async () => {
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (cancelled) return;

        try {
          const url = import.meta.env.VITE_SUPABASE_URL;
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

          if (!url || !key || url.includes('YOUR_API_KEY') || key.includes('YOUR_API_KEY')) {
            throw new Error('Missing Supabase environment variables in .env file.');
          }

          const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`Startup timeout on attempt ${attempt}: Could not connect to the database.`)), 15000));

          const primaryCheck = async () => {
              // Using a lightweight query for health check.
              const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
              if (error) {
                  if (error.code === '42P01') { // '42P01' is "undefined_table"
                      throw new Error("Database connection successful, but 'profiles' table is missing. Please check your migrations.");
                  }
                  throw error;
              }
          };

          await Promise.race([primaryCheck(), timeout]);
          
          if (!cancelled) {
            setStatus('ok');
            return; // Success, exit the loop
          }

        } catch (err: any) {
          console.error(`[startup] Health check attempt ${attempt} failed:`, err);
          if (attempt === maxRetries) {
            if (!cancelled) {
              setStatus(safe ? 'degraded' : 'error');
              setDetail(String(err.message || 'Failed to connect to the database after multiple attempts.'));
            }
          } else {
            if (!cancelled) {
              await new Promise(res => setTimeout(res, retryDelay));
            }
          }
        }
      }
    };

    performHealthCheck();

    return () => { cancelled = true; };
  }, [safe]);

  return { status, detail, safeMode: safe };
}
