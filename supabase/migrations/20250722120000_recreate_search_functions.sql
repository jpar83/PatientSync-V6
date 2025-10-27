/*
# [Function] Recreate Global Search Function

## Query Description: [This script drops and recreates the `global_search` function to fix a return type mismatch error. The new version ensures the correct columns are returned, enabling consistent cross-table search results for patients, referrals, and intake records.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Drops function `global_search(text)`
- Drops function `compare_patient_records_batch(jsonb)`
- Creates function `global_search(text)`
- Creates function `compare_patient_records_batch(jsonb)`

## Security Implications:
- RLS Status: Not Applicable
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The function is only called on user search.
*/

-- Drop the old, faulty functions first to avoid conflicts.
DROP FUNCTION IF EXISTS public.global_search(p_search_term text);
DROP FUNCTION IF EXISTS public.compare_patient_records_batch(new_data_batch jsonb);


-- Recreate the global search function with the correct return signature.
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(id uuid, name text, type text, route text, source_table text)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
        -- Patient Records
        SELECT
            p.id,
            p.name,
            'patient'::text as type,
            ('/patients/' || p.id)::text as route,
            'patients'::text as source_table
        FROM
            public.patients p
        WHERE
            p.name ILIKE '%' || p_search_term || '%' OR p.email ILIKE '%' || p_search_term || '%'

        UNION ALL

        -- Referral Records (Orders not in initial stage)
        SELECT
            o.id,
            p.name,
            'referral'::text as type,
            ('/referrals?highlight=' || o.id)::text as route,
            'orders'::text as source_table
        FROM
            public.orders o
            JOIN public.patients p ON o.patient_id = p.id
        WHERE
            (p.name ILIKE '%' || p_search_term || '%' OR p.email ILIKE '%' || p_search_term || '%')
            AND o.workflow_stage != 'Referral Received'

        UNION ALL

        -- Intake Records (Orders in initial stage)
        SELECT
            o.id,
            p.name,
            'intake'::text as type,
            ('/intake?highlight=' || o.id)::text as route,
            'orders'::text as source_table
        FROM
            public.orders o
            JOIN public.patients p ON o.patient_id = p.id
        WHERE
            (p.name ILIKE '%' || p_search_term || '%' OR p.email ILIKE '%' || p_search_term || '%')
            AND o.workflow_stage = 'Referral Received';
END;
$$;


-- Recreate the batch comparison function to ensure it's available and correct.
CREATE OR REPLACE FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
RETURNS TABLE (
    email text,
    status text,
    diffs jsonb,
    existing jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH new_data AS (
        SELECT
            (elem->>'email')::text as email,
            elem as new_record
        FROM jsonb_array_elements(new_data_batch) elem
    )
    SELECT
        nd.email,
        'exists'::text as status,
        (
            SELECT jsonb_agg(diff)
            FROM (
                SELECT
                    kv.key as field,
                    p_existing.record->>kv.key as old_value,
                    nd.new_record->>kv.key as new_value
                FROM jsonb_each_text(nd.new_record) kv
                WHERE
                    coalesce(p_existing.record->>kv.key, '') <> coalesce(nd.new_record->>kv.key, '')
                    AND nd.new_record->>kv.key IS NOT NULL
            ) diff
        ) as diffs,
        p_existing.record as existing
    FROM new_data nd
    JOIN (
        SELECT email, to_jsonb(patients) as record
        FROM public.patients
    ) p_existing ON nd.email = p_existing.email;
END;
$$;
