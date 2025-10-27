/*
  # [Function Update] Consolidate Global Search
  This operation updates the `global_search` function to remove the 'Intake' search category and correct an invalid column reference.

  ## Query Description:
  - Drops the existing `global_search` function to prevent signature conflicts.
  - Recreates the function to search only the `patients` and `orders` tables.
  - Fixes a bug by correctly joining `orders` with `patients` to get the patient's name, instead of referencing a non-existent column.
  - This change is safe and non-destructive to your data.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by restoring the previous function definition)

  ## Security Implications:
  - RLS Status: Not applicable to functions directly, but function runs with definer security.
  - Policy Changes: No
  - Auth Requirements: None
*/

-- Drop the old function to be safe
DROP FUNCTION IF EXISTS public.global_search(p_search_term text);
DROP FUNCTION IF EXISTS public.global_search(text);

-- Recreate the function without the 'intake' part and with the correct join
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
    -- Search Patients
    SELECT DISTINCT
      p.id,
      p.full_name,
      'patient' AS type,
      '/patients/' || p.id AS route,
      'patients' AS source_table
    FROM public.patients AS p
    WHERE p.full_name ILIKE '%' || p_search_term || '%'

    UNION ALL

    -- Search Referrals (Orders) by Patient Name
    SELECT DISTINCT
      o.id,
      p.full_name,
      'referral' AS type,
      '/referrals?highlight=' || o.id AS route,
      'orders' AS source_table
    FROM public.orders AS o
    JOIN public.patients AS p ON o.patient_id = p.id
    WHERE p.full_name ILIKE '%' || p_search_term || '%'
$$;
