/*
# [Function] Recreate Core Database Functions
[This script drops and recreates core database functions to resolve signature conflicts and ensure they are up-to-date. This is necessary when function return types or arguments change.]

## Query Description: [This operation safely updates the 'global_search' and 'compare_patient_records_batch' functions. It first removes the old versions before creating the new ones, which prevents migration errors related to signature changes. There is no risk to existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops and recreates `public.global_search(text)`
- Drops and recreates `public.compare_patient_records_batch(jsonb)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Functions are set with SECURITY DEFINER and a safe search_path.]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible. Function definitions are updated.]
*/

-- Drop existing functions to allow for signature changes
DROP FUNCTION IF EXISTS public.global_search(text);
DROP FUNCTION IF EXISTS public.compare_patient_records_batch(jsonb);

-- Recreate global_search function
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(id text, type text, name text, description text, path text)
LANGUAGE plpgsql
SECURITY DEFINER
-- IMPORTANT: Set a safe search_path
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    -- Search Patients
    SELECT
        p.id::text,
        'patient'::text,
        p.name,
        'Patient Record'::text as description,
        '/referrals?patient_id=' || p.id::text as path
    FROM patients p
    WHERE p.name ILIKE '%' || p_search_term || '%'
    OR p.email ILIKE '%' || p_search_term || '%'
    LIMIT 5

    UNION ALL

    -- Search Orders
    SELECT
        o.id::text,
        'order'::text,
        p.name,
        'Order for ' || o.chair_type as description,
        '/referrals?order_id=' || o.id::text as path
    FROM orders o
    JOIN patients p ON o.patient_id = p.id
    WHERE p.name ILIKE '%' || p_search_term || '%'
    OR o.chair_type ILIKE '%' || p_search_term || '%'
    LIMIT 5

    UNION ALL

    -- Search Audit Logs
    SELECT
        a.id::text,
        'audit'::text,
        a.action,
        'Audit Log Entry by ' || a.changed_by as description,
        '/audit-log?focus=' || a.id::text as path
    FROM audit_log a
    WHERE a.action ILIKE '%' || p_search_term || '%'
    OR a.changed_by ILIKE '%' || p_search_term || '%'
    OR a.changed_user ILIKE '%' || p_search_term || '%'
    ORDER BY timestamp DESC
    LIMIT 5;
END;
$$;

-- Recreate compare_patient_records_batch function
CREATE OR REPLACE FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
RETURNS TABLE (
    email text,
    status text,
    diffs jsonb,
    existing jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_record jsonb;
    existing_record patients;
    diff_array jsonb[];
    field_key text;
    new_value jsonb;
    old_value jsonb;
    diff_item jsonb;
BEGIN
    -- Create a temporary table to hold the new data
    CREATE TEMP TABLE new_data_temp (data jsonb) ON COMMIT DROP;
    INSERT INTO new_data_temp (data)
    SELECT * FROM jsonb_array_elements(new_data_batch);

    FOR new_record IN SELECT data FROM new_data_temp
    LOOP
        -- Find the existing record by email
        SELECT * INTO existing_record
        FROM patients
        WHERE patients.email = (new_record->>'email')::text;

        IF NOT FOUND THEN
            -- If no record exists, status is 'new'
            status := 'new';
            diffs := '[]'::jsonb;
            existing := null;
        ELSE
            -- If record exists, compare fields
            status := 'exists';
            diff_array := '{}';

            FOR field_key, new_value IN SELECT * FROM jsonb_each(new_record)
            LOOP
                -- Get the old value from the existing record
                EXECUTE format('SELECT to_jsonb(($1).%I)', field_key)
                INTO old_value
                USING existing_record;

                -- Normalize NULLs and empty strings for comparison
                IF (new_value IS NULL OR new_value::text = '""' OR new_value::text = 'null') AND (old_value IS NULL OR old_value::text = '""' OR old_value::text = 'null') THEN
                    -- Both are considered empty, so no diff
                    CONTINUE;
                END IF;

                -- Compare values
                IF new_value::text != old_value::text THEN
                    diff_item := jsonb_build_object(
                        'field', field_key,
                        'new_value', new_value,
                        'old_value', old_value
                    );
                    diff_array := diff_array || diff_item;
                END IF;
            END LOOP;

            diffs := to_jsonb(diff_array);
            existing := to_jsonb(existing_record);
        END IF;

        email := new_record->>'email';
        RETURN NEXT;

    END LOOP;

    DROP TABLE new_data_temp;
END;
$$;

-- Grant usage on the functions to the authenticated role
GRANT EXECUTE ON FUNCTION public.global_search(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compare_patient_records_batch(jsonb) TO authenticated;
