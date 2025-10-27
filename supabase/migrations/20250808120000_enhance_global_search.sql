/*
# [Function] Enhance and Secure Global Search
This operation replaces the existing `global_search` function with a more powerful and secure version. It expands search capabilities to include patient names, insurance providers, and workflow stages. It also explicitly sets the function's search path to mitigate security risks related to search path hijacking.

## Query Description: [This operation replaces the existing `global_search` function. It does not alter any data, but it improves the security and functionality of the application's global search feature.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function `global_search(p_search_term TEXT)` will be replaced.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [None]
- Mitigates: [Function Search Path Mutable warning]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible performance impact. This is a security and functionality enhancement.]
*/

CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(id uuid, name text, type text, route text, source_table text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    RETURN QUERY
    -- Search for Patients by name or insurance
    SELECT
        p.id,
        p.name,
        'patient' as type,
        '/referrals?openPatientId=' || p.id::text as route,
        'patients' as source_table
    FROM
        patients p
    WHERE
        p.name ILIKE '%' || p_search_term || '%' OR
        p.primary_insurance ILIKE '%' || p_search_term || '%'
    
    UNION -- Use UNION to avoid showing the same patient twice if their order also matches
    
    -- Search for Orders by workflow stage
    SELECT
        p.id, -- Return patient ID to open the correct drawer
        p.name || ' (' || o.workflow_stage || ')' as name, -- Combine patient name and stage
        'referral' as type,
        '/referrals?openPatientId=' || p.id::text as route,
        'orders' as source_table
    FROM
        orders o
    JOIN
        patients p ON o.patient_id = p.id
    WHERE
        o.workflow_stage ILIKE '%' || p_search_term || '%';
END;
$function$;
