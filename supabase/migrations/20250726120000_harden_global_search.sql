/*
          # [Operation Name]
          Hardens the `global_search` function by setting a secure search path.

          ## Query Description: "This operation modifies a core database function to improve security. It will drop and recreate the `global_search` function to explicitly set its `search_path`, mitigating potential SQL injection risks. There is no impact on existing data, but this change is crucial for application security."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function: `public.global_search(p_search_term TEXT)`
          
          ## Security Implications:
          - RLS Status: Not Applicable
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. Improves security without performance degradation.
          */
DROP FUNCTION IF EXISTS public.global_search(p_search_term TEXT);

CREATE OR REPLACE FUNCTION public.global_search(p_search_term TEXT)
RETURNS TABLE(id UUID, name TEXT, type TEXT, route TEXT, source_table TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        'patient'::TEXT AS type,
        '/referrals?openPatientId=' || p.id::TEXT AS route,
        'patients'::TEXT AS source_table
    FROM patients p
    WHERE p.name ILIKE '%' || p_search_term || '%'
      AND p.archived IS NOT TRUE

    UNION ALL

    SELECT
        o.id,
        o.patient_name,
        'referral'::TEXT AS type,
        '/referrals?openPatientId=' || o.patient_id::TEXT AS route,
        'orders'::TEXT AS source_table
    FROM orders o
    WHERE o.patient_name ILIKE '%' || p_search_term || '%'
      AND o.is_archived IS NOT TRUE;
END;
$$;
