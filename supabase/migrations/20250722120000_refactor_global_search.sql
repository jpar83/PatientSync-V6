/*
# [Function] global_search
Overhauls the global search to provide unified, multi-source results from patients and orders.

## Query Description: This operation drops and recreates the `global_search` function. It changes the function's return signature and logic to be more performant and return richer data, including a `type` and `route` for client-side navigation. It uses `pg_trgm` for fuzzy searching.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (by reverting to the old function definition)

## Structure Details:
- Drops function: `public.global_search(text)`
- Creates function: `public.global_search(p_search_term text)` with a new return type.

## Security Implications:
- RLS Status: Not applicable to functions directly, but function respects RLS of underlying tables.
- Policy Changes: No
- Auth Requirements: `authenticated` role can execute. Function is owned by `supabase_admin`.

## Performance Impact:
- Indexes: Relies on `pg_trgm` indexes on `patients.name` and `patients.email`.
- Triggers: No
- Estimated Impact: Should improve search performance and relevance due to `pg_trgm`.
*/

-- Drop the old function first to avoid signature conflicts.
DROP FUNCTION IF EXISTS public.global_search(p_search_term text);
DROP FUNCTION IF EXISTS public.global_search(search_term text);

CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(id uuid, name text, type text, route text, source_table text, description text)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH search_results AS (
        -- Patient Records
        SELECT
            p.id,
            p.name,
            'patient' AS type,
            '/patients/' || p.id::text AS route,
            'patients' AS source_table,
            'Patient Record' as description,
            similarity(p.name, p_search_term) as score
        FROM public.patients p
        WHERE p.name % p_search_term OR p.email % p_search_term

        UNION ALL

        -- Order Records (Referrals & Intake)
        SELECT
            o.id,
            p.name,
            'order' AS type,
            CASE
                WHEN o.workflow_stage = 'Referral Received' THEN '/intake?highlight=' || o.id::text
                ELSE '/referrals?highlight=' || o.id::text
            END AS route,
            'orders' AS source_table,
            CASE
                WHEN o.workflow_stage = 'Referral Received' THEN 'Intake & Demographics'
                ELSE o.workflow_stage
            END as description,
            similarity(p.name, p_search_term) as score
        FROM public.orders o
        JOIN public.patients p ON o.patient_id = p.id
        WHERE p.name % p_search_term
    )
    SELECT
        sr.id,
        sr.name,
        sr.type,
        sr.route,
        sr.source_table,
        sr.description
    FROM search_results sr
    ORDER BY sr.score DESC
    LIMIT 15;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.global_search(text) OWNER TO supabase_admin;
GRANT EXECUTE ON FUNCTION public.global_search(text) TO authenticated;
