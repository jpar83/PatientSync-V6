/*
# [Function] Create Batch Patient Record Comparison and Secure Global Search
[This migration creates the `compare_patient_records_batch` function required for the import feature and updates the `global_search` function with better security practices.]

## Query Description: [This operation creates one new function and replaces another. It is a safe, non-destructive operation that adds and enhances functionality for data import and search. It does not modify any existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Function: `public.compare_patient_records_batch(jsonb)` (New)
- Function: `public.global_search(jsonb)` (Updated)

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [Functions are set with `SECURITY DEFINER` and the search path is explicitly set to `public` to prevent search path hijacking, addressing a security advisory.]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Low. These functions are called for specific user actions (import, search) and are designed to be efficient.]
*/

-- Grant authenticated users execute permissions on new functions in the public schema.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- Drop the old singular function if it exists to avoid confusion.
DROP FUNCTION IF EXISTS public.compare_patient_record(jsonb);

-- Creates a function to compare a batch of new patient data against existing records.
CREATE OR REPLACE FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_record jsonb;
    existing_record patients;
    diffs jsonb[];
    field_key text;
    new_value text;
    old_value text;
BEGIN
    FOR new_record IN SELECT * FROM jsonb_array_elements(new_data_batch)
    LOOP
        -- Find the existing patient by email
        SELECT * INTO existing_record
        FROM patients
        WHERE patients.email = (new_record->>'email');

        -- If a matching patient is found, compare fields
        IF FOUND THEN
            diffs := '{}';

            -- Iterate over the keys in the new JSON record
            FOR field_key, new_value IN SELECT key, value FROM jsonb_each_text(new_record)
            LOOP
                -- Skip keys that are not comparable columns in the patients table
                IF NOT (field_key IN ('name', 'dob', 'gender', 'phone_number', 'address_line1', 'address_line2', 'city', 'state', 'zip', 'primary_insurance', 'secondary_insurance', 'policy_number', 'group_number', 'insurance_notes', 'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone')) THEN
                    CONTINUE;
                END IF;

                -- Get the old value from the existing record
                EXECUTE format('SELECT ($1).%I::text', field_key)
                INTO old_value
                USING existing_record;

                -- Normalize NULLs and empty strings for comparison
                new_value := trim(new_value);
                old_value := trim(coalesce(old_value, ''));
                
                IF new_value IS DISTINCT FROM old_value THEN
                    diffs := diffs || jsonb_build_object(
                        'field', field_key,
                        'old_value', old_value,
                        'new_value', new_value
                    );
                END IF;
            END LOOP;

            -- Return a result for this record, including the diffs
            RETURN NEXT jsonb_build_object(
                'email', new_record->>'email',
                'status', 'exists',
                'diffs', diffs,
                'existing', row_to_json(existing_record)
            );
        END IF;
    END LOOP;

    RETURN;
END;
$$;

-- Recreate the global search function with an explicit, secure search_path.
CREATE OR REPLACE FUNCTION public.global_search(p_params jsonb)
RETURNS TABLE(type text, id uuid, name text, description text, path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    p_search_term text := p_params->>'p_search_term';
BEGIN
    RETURN QUERY
    -- Search Patients
    SELECT
        'patient'::text,
        p.id,
        p.name,
        'Patient - ' || coalesce(p.primary_insurance, 'No Insurance'),
        '/patients?patient_id=' || p.id::text
    FROM patients p
    WHERE p.name ILIKE ('%' || p_search_term || '%') OR p.email ILIKE ('%' || p_search_term || '%')
    LIMIT 5

    UNION ALL

    -- Search Orders (by patient name)
    SELECT
        'order'::text,
        o.id,
        p.name || ' - Order',
        'Order - ' || o.workflow_stage,
        '/referrals?order_id=' || o.id::text
    FROM orders o
    JOIN patients p ON o.patient_id = p.id
    WHERE p.name ILIKE ('%' || p_search_term || '%')
    LIMIT 5

    UNION ALL

    -- Search Audit Log
    SELECT
        'audit'::text,
        a.id,
        a.action,
        'Audit - by ' || a.changed_by || ' on ' || coalesce(a.changed_user, 'System'),
        '/audit-log?focus=' || a.id::text
    FROM audit_log a
    WHERE a.action ILIKE ('%' || p_search_term || '%')
        OR a.changed_by ILIKE ('%' || p_search_term || '%')
        OR a.changed_user ILIKE ('%' || p_search_term || '%')
    ORDER BY timestamp DESC
    LIMIT 5;
END;
$$;
