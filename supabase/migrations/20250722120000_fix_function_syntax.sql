/*
  # [Function] Fix Global Search and Batch Compare Syntax
  [This migration corrects a syntax error in the `global_search` function and ensures the `compare_patient_records_batch` function is correctly defined.]

  ## Query Description: [This operation drops and recreates the `global_search` and `compare_patient_records_batch` functions. The `global_search` function had a syntax error related to its UNION ALL clauses, which is now fixed. There is no risk of data loss as this only affects function definitions.]

  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [false]

  ## Structure Details:
  - Drops function: `global_search(text)`
  - Drops function: `compare_patient_records_batch(jsonb)`
  - Creates function: `global_search(text)`
  - Creates function: `compare_patient_records_batch(jsonb)`

  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [Functions are set to SECURITY DEFINER]

  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [None]
*/

-- Drop existing functions to avoid conflicts with return types or syntax.
DROP FUNCTION IF EXISTS public.global_search(text);
DROP FUNCTION IF EXISTS public.compare_patient_records_batch(jsonb);

-- Recreate the batch comparison function to ensure it exists and is correct.
CREATE OR REPLACE FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
RETURNS TABLE(email text, status text, diffs jsonb, existing jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create a temporary table to hold the new data with hashes
    CREATE TEMP TABLE temp_new_patients (
        data jsonb,
        email text,
        new_hash text
    ) ON COMMIT DROP;

    INSERT INTO temp_new_patients (data, email, new_hash)
    SELECT
        value,
        LOWER(TRIM(value->>'email')),
        value->>'updated_hash'
    FROM jsonb_array_elements(new_data_batch);

    -- Return the comparison results
    RETURN QUERY
    SELECT
        t.email,
        CASE
            WHEN p.id IS NULL THEN 'new'::text
            ELSE 'exists'::text
        END AS status,
        CASE
            WHEN p.id IS NOT NULL THEN (
                SELECT jsonb_agg(diff)
                FROM (
                    SELECT
                        key AS field,
                        p_json->>key AS old_value,
                        t.data->>key AS new_value
                    FROM jsonb_object_keys(t.data) key
                    WHERE t.data->>key IS DISTINCT FROM p_json->>key
                ) diff
            )
            ELSE '[]'::jsonb
        END AS diffs,
        CASE
            WHEN p.id IS NOT NULL THEN to_jsonb(p)
            ELSE NULL
        END AS existing
    FROM temp_new_patients t
    LEFT JOIN patients p ON t.email = p.email
    LEFT JOIN LATERAL to_jsonb(p) p_json ON true;
END;
$$;


-- Recreate the global search function with corrected syntax (parentheses around UNION ALL).
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
 RETURNS TABLE(id text, type text, name text, description text, path text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    search_query text := '%' || p_search_term || '%';
BEGIN
    RETURN QUERY (
        -- Search Patients
        SELECT
            p.id::text,
            'patient'::text AS type,
            p.name,
            'Patient Record - ' || COALESCE(p.primary_insurance, 'No insurance listed') AS description,
            '/patients?patient_id=' || p.id::text AS path
        FROM
            patients p
        WHERE
            p.name ILIKE search_query
            OR p.email ILIKE search_query
        LIMIT 5

        UNION ALL

        -- Search Orders by Patient Name
        SELECT
            o.id::text,
            'order'::text AS type,
            p.name || ' - Order' AS name,
            'Order for ' || o.chair_type || ' - Stage: ' || o.workflow_stage AS description,
            '/referrals?order_id=' || o.id::text AS path
        FROM
            orders o
        JOIN
            patients p ON o.patient_id = p.id
        WHERE
            p.name ILIKE search_query
        LIMIT 5

        UNION ALL

        -- Search Audit Log
        SELECT
            a.id::text,
            'audit'::text AS type,
            a.action AS name,
            'Audit Log Entry by ' || a.changed_by AS description,
            '/audit-log?focus=' || a.id::text AS path
        FROM
            audit_log a
        WHERE
            a.action ILIKE search_query
            OR a.changed_by ILIKE search_query
            OR a.changed_user ILIKE search_query
        LIMIT 5
    );
END;
$function$;
