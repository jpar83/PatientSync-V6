/*
# [Fix] Correct Global Search Function
This migration replaces the `global_search` function to fix a bug that caused search to fail. The previous version incorrectly referenced a `patient_name` column on the `orders` table, which does not exist. This version corrects the query by properly joining the `orders` and `patients` tables to retrieve the patient's name.

## Query Description:
- **Impact:** This operation replaces an existing database function. It does not alter any table data and is considered safe to run. It will fix the global search feature in the application header.
- **Risks:** Low. This is a function replacement.
- **Precautions:** None required.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by reverting to the previous function definition if available)

## Structure Details:
- Function `global_search(p_search_term text)` will be replaced.

## Security Implications:
- RLS Status: Not applicable to function definition itself, but function execution respects RLS.
- Policy Changes: No.
- Auth Requirements: The function is set with `SECURITY DEFINER` to allow searching across tables, but the underlying queries should be designed to respect data access rules where necessary.
- Search Path: Explicitly set to `public` to mitigate search path hijacking vulnerabilities.

## Performance Impact:
- Indexes: The query will benefit from indexes on `patients.name` and `orders.workflow_stage`.
- Triggers: None.
- Estimated Impact: Negligible. Performance should be fast for typical search volumes.
*/
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(id uuid, name text, type text, route text, source_table text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    -- Search Patients by name
    SELECT
        p.id,
        p.name,
        'patient' AS type,
        '/referrals?openPatientId=' || p.id::text AS route,
        'patients' AS source_table
    FROM
        patients p
    WHERE
        p.name ILIKE '%' || p_search_term || '%'
        AND p.is_archived IS DISTINCT FROM TRUE

    UNION ALL

    -- Search Orders by patient name or workflow stage
    SELECT
        o.id,
        p.name, -- The fix is here
        'referral' AS type,
        '/referrals?openPatientId=' || o.patient_id::text AS route,
        'orders' AS source_table
    FROM
        orders o
    JOIN
        patients p ON o.patient_id = p.id -- And here
    WHERE
        (p.name ILIKE '%' || p_search_term || '%' OR o.workflow_stage ILIKE '%' || p_search_term || '%')
        AND p.is_archived IS DISTINCT FROM TRUE;
END;
$function$;
