/*
# [Functions] Create Core Business Logic Functions
This migration creates or replaces two key RPC functions: `compare_patient_records_batch` for efficient data import diffing, and `global_search` for application-wide searching.

## Query Description: [This operation sets up essential server-side logic. `compare_patient_records_batch` allows the app to efficiently check for differences between imported data and existing records in bulk, reducing database load. `global_search` provides a powerful, unified search endpoint. These functions are set to `SECURITY DEFINER` to run with the permissions of the function owner, allowing controlled access to data. Re-running this script is safe as it uses `CREATE OR REPLACE`.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Functions Created/Replaced: `compare_patient_records_batch(jsonb)`, `global_search(text)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: `authenticated` role can execute. Functions are `SECURITY DEFINER`.

## Performance Impact:
- Indexes: These functions are designed to leverage indexes (like pg_trgm) for good performance.
- Triggers: None
- Estimated Impact: Positive. Centralizes logic in the database for efficiency.
*/

-- Function to compare a batch of new patient data with existing records
CREATE OR REPLACE FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
RETURNS TABLE(email text, status text, diffs jsonb, existing jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_record jsonb;
    existing_record record;
    diff_json jsonb;
BEGIN
    -- Create a temporary table to hold the new data
    CREATE TEMP TABLE temp_new_patients (data jsonb) ON COMMIT DROP;
    INSERT INTO temp_new_patients SELECT * FROM jsonb_array_elements(new_data_batch);

    FOR new_record IN SELECT * FROM temp_new_patients
    LOOP
        SELECT * INTO existing_record FROM public.patients WHERE public.patients.email = (new_record->>'email');

        IF existing_record IS NULL THEN
            status := 'new';
            diffs := '[]'::jsonb;
            existing := NULL;
        ELSE
            status := 'exists';
            -- Call the single record comparison function
            SELECT * INTO diff_json FROM public.compare_patient_record(new_record);
            diffs := diff_json;
            existing := row_to_json(existing_record);
        END IF;
        
        email := new_record->>'email';
        RETURN NEXT;
    END LOOP;

    DROP TABLE temp_new_patients;
END;
$$;


-- Function for global search across patients, orders, and audit logs
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(type text, id text, name text, description text, path text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Search Patients
    RETURN QUERY
    SELECT
        'patient'::text AS type,
        p.id::text,
        p.name,
        'Patient | ' || p.primary_insurance AS description,
        '/patients?focus=' || p.id::text AS path
    FROM public.patients p
    WHERE p.name ILIKE '%' || p_search_term || '%'
       OR p.email ILIKE '%' || p_search_term || '%'
    LIMIT 5;

    -- Search Orders (by patient name)
    RETURN QUERY
    SELECT
        'order'::text AS type,
        o.id::text,
        p.name,
        'Order | ' || o.workflow_stage AS description,
        '/referrals?order_id=' || o.id::text AS path
    FROM public.orders o
    JOIN public.patients p ON o.patient_id = p.id
    WHERE p.name ILIKE '%' || p_search_term || '%'
    LIMIT 5;
    
    -- Search Audit Logs
    RETURN QUERY
    SELECT
        'audit'::text as type,
        al.id::text,
        al.action,
        'Audit | By: ' || al.changed_by || ' | On: ' || al.changed_user as description,
        '/audit-log?focus=' || al.id::text as path
    FROM public.audit_log al
    WHERE al.action ILIKE '%' || p_search_term || '%'
       OR al.changed_by ILIKE '%' || p_search_term || '%'
       OR al.changed_user ILIKE '%' || p_search_term || '%'
    LIMIT 5;

END;
$$;
