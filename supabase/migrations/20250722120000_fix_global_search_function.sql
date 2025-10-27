/*
          # [Fix] Correct `global_search` Function
          This migration corrects the `global_search` database function to use the correct column names (`name` instead of `full_name` or `patient_name`) and removes the logic for searching the now-deleted `intake` table. This is a non-destructive fix that aligns the function with the current database schema.

          ## Query Description: "This operation updates a database function to fix a column name mismatch. It is a safe, non-destructive change that only affects the application's global search functionality."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Modifies function: `public.global_search`
          
          ## Security Implications:
          - RLS Status: Not applicable
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: No change
          - Triggers: No change
          - Estimated Impact: Low. The function will now execute correctly instead of erroring.
          */

-- Drop the old function to avoid any signature conflicts
DROP FUNCTION IF EXISTS public.global_search(text);

-- Recreate the function with the correct column names and logic
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  route text,
  source_table text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Search Patients by name
  SELECT DISTINCT
    p.id,
    p.name, -- Corrected from p.full_name
    'patient' as type,
    '/patients/' || p.id::text as route,
    'patients' as source_table
  FROM public.patients p
  WHERE lower(p.name) LIKE '%' || lower(p_search_term) || '%'

  UNION ALL

  -- Search Referrals by Patient Name
  SELECT DISTINCT
    o.id,
    p.name, -- Correctly get name from joined patients table
    'referral' as type,
    '/referrals?highlight=' || o.id::text as route,
    'orders' as source_table
  FROM public.orders o
  JOIN public.patients p ON o.patient_id = p.id
  WHERE lower(p.name) LIKE '%' || lower(p_search_term) || '%';
$$;
