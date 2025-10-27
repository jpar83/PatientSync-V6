/*
  # [Function] Global Search Overhaul
  [This migration replaces the global_search function with a more robust version that searches across patients and their associated orders, returning a unified result set.]

  ## Query Description: [This operation drops the existing 'global_search' function and recreates it. The new function joins 'patients' and 'orders' tables to provide comprehensive search results, including direct patient records and related referrals/intake orders. There is no risk to existing data, but this is critical for the application's search feature to work correctly.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
  
  ## Structure Details:
  - Drops function: public.global_search(text)
  - Creates function: public.global_search(p_search_term text)
  
  ## Security Implications:
  - RLS Status: Not applicable
  - Policy Changes: No
  - Auth Requirements: The function is defined with SECURITY DEFINER.
  
  ## Performance Impact:
  - Indexes: This function will benefit from pg_trgm indexes on patients.name and patients.email.
  - Triggers: None
  - Estimated Impact: Low. The function is designed to be efficient for type-ahead search.
*/

-- Drop the old function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.global_search(text);
DROP FUNCTION IF EXISTS public.global_search(p_search_term text);

-- Recreate the function with the correct logic
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(
  id uuid,
  name text,
  type text,
  route text,
  source_table text
)
STABLE
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Search for matching patients directly
  SELECT
    p.id,
    p.name,
    'patient' as type,
    '/patients/' || p.id::text as route,
    'patients' as source_table
  FROM public.patients p
  WHERE
    p.name ILIKE ('%' || p_search_term || '%') OR
    p.email ILIKE ('%' || p_search_term || '%')

  UNION ALL

  -- Search for matching orders (as referrals/intake)
  SELECT
    o.id,
    p.name,
    CASE
      WHEN o.workflow_stage = 'Patient Intake & Demographics' THEN 'intake'
      ELSE 'referral'
    END as type,
    CASE
      WHEN o.workflow_stage = 'Patient Intake & Demographics' THEN '/intake?highlight=' || o.id::text
      ELSE '/referrals?highlight=' || o.id::text
    END as route,
    'orders' as source_table
  FROM public.orders o
  JOIN public.patients p ON o.patient_id = p.id
  WHERE
    (
      p.name ILIKE ('%' || p_search_term || '%') OR
      p.email ILIKE ('%' || p_search_term || '%')
    )
    AND o.is_archived = false;
$$;
