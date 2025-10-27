/*
          # [Fix] Correct the global_search function
          This migration corrects a critical bug in the `global_search` function that caused it to fail. The function was incorrectly trying to query a `patient_name` column on the `orders` table, which does not exist.

          ## Query Description: [This operation will safely replace the existing `global_search` function with a corrected version. It correctly joins the `patients` table to search by name and is designed to be more resilient. There is no risk to existing data.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function `global_search(text)` will be dropped and recreated.
          
          ## Security Implications:
          - RLS Status: Not applicable
          - Policy Changes: No
          - Auth Requirements: Grants EXECUTE to `anon` and `authenticated` roles.
          
          ## Performance Impact:
          - Indexes: The query will benefit from an index on `patients.name`.
          - Triggers: None
          - Estimated Impact: Low. The query includes `LIMIT` clauses to ensure it remains performant.
          */

DROP FUNCTION IF EXISTS global_search(text);

CREATE OR REPLACE FUNCTION global_search(p_search_term text)
RETURNS TABLE(id uuid, name text, type text, route text, source_table text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    -- Search Patients by name
    SELECT
      p.id,
      p.name,
      'patient'::text AS type,
      '/referrals?openPatientId=' || p.id::text AS route,
      'patients'::text AS source_table
    FROM
      patients p
    WHERE
      p.name ILIKE '%' || p_search_term || '%'
    LIMIT 5
  ) AS patients_search

  UNION ALL

  SELECT * FROM (
    -- Search Referrals (Orders) by patient name
    SELECT
      o.id,
      p.name || ' (Order #' || RIGHT(o.id::text, 4) || ')' AS name,
      'referral'::text AS type,
      '/referrals?openPatientId=' || o.patient_id::text AS route,
      'orders'::text AS source_table
    FROM
      orders o
    LEFT JOIN
      patients p ON o.patient_id = p.id
    WHERE
      p.name ILIKE '%' || p_search_term || '%'
    LIMIT 5
  ) AS orders_search;

END;
$$;

GRANT EXECUTE ON FUNCTION global_search(text) TO anon;
GRANT EXECUTE ON FUNCTION global_search(text) TO authenticated;
