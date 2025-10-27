/*
# [Functions] Create Core Business Logic Functions
This migration creates or replaces two key RPC functions: `compare_patient_records_batch` for the data import diffing logic, and `global_search` for the application-wide search feature.

## Query Description:
- `compare_patient_records_batch(jsonb[])`: Takes a batch of patient records as JSON. For each record, it finds the existing patient by email and generates a "diff" of changed fields. This is crucial for the "review changes" step in the import process. It is designed to be efficient for bulk operations.
- `global_search(text)`: Performs a fuzzy search across patients (name, email), orders (patient name), and audit logs (action, user). It uses trigram indexes for performance and returns a standardized result set for the UI.
- Both functions are set to `SECURITY DEFINER` to bypass RLS for these specific, controlled operations. This is necessary for them to search across all records, but access is restricted via function-level permissions.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (by dropping the functions)

## Structure Details:
- Functions Created/Replaced: `compare_patient_records_batch`, `global_search`

## Security Implications:
- RLS Status: Bypassed via `SECURITY DEFINER`.
- Policy Changes: No
- Auth Requirements: Access to these functions should be granted only to the `authenticated` role.

## Performance Impact:
- Indexes: These functions rely on the trigram indexes created in `03_indexes.sql` for efficient searching. Without them, performance would be poor.
- Triggers: None
- Estimated Impact: High positive impact on application functionality.
*/

-- Ensure pg_trgm is available for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function to compare a batch of new patient data with existing records
CREATE OR REPLACE FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
RETURNS TABLE(email text, status text, diffs jsonb, existing jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
AS $$
DECLARE
    new_record jsonb;
    existing_record patients;
    diff_list jsonb[];
    field_key text;
    new_val text;
    old_val text;
BEGIN
    FOR new_record IN SELECT * FROM jsonb_array_elements(new_data_batch)
    LOOP
        SELECT * INTO existing_record
        FROM public.patients
        WHERE lower(public.patients.email) = lower(new_record->>'email');

        IF NOT FOUND THEN
            status := 'new';
            diffs := '[]'::jsonb;
            existing := null;
        ELSE
            status := 'exists';
            diff_list := '{}';
            existing := row_to_json(existing_record);

            FOR field_key, new_val IN SELECT key, value FROM jsonb_each_text(new_record)
            LOOP
                -- Compare new value with the corresponding field in the existing record
                EXECUTE format('SELECT ($1).%I::text', field_key)
                INTO old_val
                USING existing_record;

                IF new_val IS DISTINCT FROM old_val THEN
                    diff_list := diff_list || jsonb_build_object(
                        'field', field_key,
                        'old_value', old_val,
                        'new_value', new_val
                    );
                END IF;
            END LOOP;
            diffs := array_to_json(diff_list)::jsonb;
        END IF;

        email := new_record->>'email';
        RETURN NEXT;
    END LOOP;
END;
$$;


-- Global search function
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(type text, id text, name text, description text, path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
AS $$
BEGIN
    -- Search Patients
    RETURN QUERY
    SELECT
        'patient'::text as type,
        p.id::text as id,
        p.name,
        'Patient Record - ' || p.email as description,
        '/patients?focus=' || p.id::text as path
    FROM public.patients p
    WHERE p.name ILIKE '%' || p_search_term || '%'
       OR p.email ILIKE '%' || p_search_term || '%'
    LIMIT 5;

    -- Search Orders (by patient name)
    RETURN QUERY
    SELECT
        'order'::text as type,
        o.id::text as id,
        p.name as name,
        'Referral - ' || o.workflow_stage as description,
        '/referrals?order_id=' || o.id::text as path
    FROM public.orders o
    JOIN public.patients p ON o.patient_id = p.id
    WHERE p.name ILIKE '%' || p_search_term || '%'
    LIMIT 5;

    -- Search Audit Log
    RETURN QUERY
    SELECT
        'audit'::text as type,
        a.id::text as id,
        a.action as name,
        'Audit Log - By: ' || a.changed_by || ' on ' || a.changed_user as description,
        '/audit-log?focus=' || a.id::text as path
    FROM public.audit_log a
    WHERE a.action ILIKE '%' || p_search_term || '%'
       OR a.changed_by ILIKE '%' || p_search_term || '%'
       OR a.changed_user ILIKE '%' || p_search_term || '%'
    ORDER BY a.timestamp DESC
    LIMIT 5;
END;
$$;
