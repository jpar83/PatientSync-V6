/*
  # [Function Security] Harden get_dashboard_metrics
  [This operation sets a fixed, safe search_path for the get_dashboard_metrics function to prevent potential hijacking attacks.]
  ## Query Description: [Sets the function's search path to 'public'. This is a safe, non-destructive security enhancement that ensures the function calls objects only from the intended schema, mitigating risks of malicious code execution through path manipulation.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function: public.get_dashboard_metrics()
  ## Security Implications:
  - RLS Status: N/A
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: N/A
  - Triggers: N/A
  - Estimated Impact: None. This is a security configuration change.
*/
ALTER FUNCTION public.get_dashboard_metrics() SET search_path = public;
