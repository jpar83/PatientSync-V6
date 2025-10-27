/*
# [Extension] Enable `pg_trgm`
Enables the `pg_trgm` extension to support efficient text similarity and pattern matching, which is beneficial for the `global_search` function.

## Query Description: This is a safe, non-destructive operation that adds new capabilities to the database. It will only run if the extension is not already installed.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false (dropping extensions can be risky)
*/
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


/*
# [Function] Create `compare_patient_records_batch`
This function is crucial for the patient data import feature. It accepts a batch of patient records as a JSONB array and compares each record against the existing data in the `patients` table, identifying differences.

## Query Description: This operation creates or replaces the `compare_patient_records_batch` function. This is a safe, non-destructive operation that only affects database programmability. It does not alter any existing data. It is essential for the "Import Center" functionality.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (can be dropped)

## Security Implications:
- RLS Status: Not Applicable
- Policy Changes: No
- Auth Requirements: To be called by authenticated users via RPC.
*/
CREATE OR REPLACE FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
RETURNS TABLE(email text, status text, diffs jsonb, existing jsonb)
LANGUAGE plpgsql
AS $$
DECLARE
    new_record jsonb;
    existing_record patients;
    field_diffs jsonb;
    key text;
    old_val text;
    new_val text;
BEGIN
    -- Temp table to store diffs for each record
    CREATE TEMP TABLE IF NOT EXISTS diff_results (
        field TEXT,
        old_value TEXT,
        new_value TEXT
    ) ON COMMIT DROP;

    FOR new_record IN SELECT * FROM jsonb_array_elements(new_data_batch)
    LOOP
        -- Find existing patient by email
        SELECT * INTO existing_record
        FROM public.patients p
        WHERE p.email = (new_record->>'email');

        TRUNCATE diff_results;

        IF NOT FOUND THEN
            RETURN QUERY SELECT new_record->>'email', 'new'::text, '[]'::jsonb, null::jsonb;
        ELSE
            -- Compare fields and collect differences
            FOR key, new_val IN SELECT * FROM jsonb_each_text(new_record)
            LOOP
                IF key = 'updated_hash' THEN
                    CONTINUE;
                END IF;

                EXECUTE format('SELECT ($1).%I::text', key)
                INTO old_val
                USING existing_record;

                IF COALESCE(old_val, '') <> COALESCE(new_val, '') THEN
                    INSERT INTO diff_results (field, old_value, new_value)
                    VALUES (key, old_val, new_val);
                END IF;
            END LOOP;

            -- Aggregate diffs into a JSON array
            SELECT jsonb_agg(jsonb_build_object('field', field, 'old_value', old_value, 'new_value', new_value))
            INTO field_diffs
            FROM diff_results;

            RETURN QUERY SELECT
                new_record->>'email',
                'exists'::text,
                COALESCE(field_diffs, '[]'::jsonb),
                row_to_json(existing_record)::jsonb;
        END IF;
    END LOOP;
END;
$$;


/*
# [Function] Create/Update `global_search`
This function provides the logic for the global search bar in the application header. It searches across patients, orders, and audit logs. This version includes `SECURITY DEFINER` and a fixed `search_path` to address security advisories.

## Query Description: This operation creates or replaces the `global_search` function. It is a safe, non-destructive operation. The `SECURITY DEFINER` and `SET search_path` clauses are added to enhance security and prevent potential search path hijacking vulnerabilities, addressing warnings from the security advisory.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (can be dropped)

## Security Implications:
- RLS Status: Not Applicable
- Policy Changes: No
- Auth Requirements: To be called by authenticated users via RPC.
*/
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(id text, type text, name text, description text, path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    -- Search Patients
    RETURN QUERY
    SELECT
        p.id::text,
        'patient'::text AS type,
        p.name,
        'Patient - ' || p.email AS description,
        '/patients?focus=' || p.id::text AS path
    FROM public.patients p
    WHERE p.name ILIKE '%' || p_search_term || '%'
       OR p.email ILIKE '%' || p_search_term || '%'
    LIMIT 5;

    -- Search Orders (by patient name)
    RETURN QUERY
    SELECT
        o.id::text,
        'order'::text AS type,
        p.name,
        'Order - ' || o.workflow_stage AS description,
        '/referrals?order_id=' || o.id::text AS path
    FROM public.orders o
    JOIN public.patients p ON o.patient_id = p.id
    WHERE p.name ILIKE '%' || p_search_term || '%'
    LIMIT 5;

    -- Search Audit Log
    RETURN QUERY
    SELECT
        a.id::text,
        'audit'::text AS type,
        a.action,
        'Audit - ' || a.changed_by AS description,
        '/audit-log?focus=' || a.id::text AS path
    FROM public.audit_log a
    WHERE a.action ILIKE '%' || p_search_term || '%'
       OR a.changed_by ILIKE '%' || p_search_term || '%'
       OR a.changed_user ILIKE '%' || p_search_term || '%'
    ORDER BY a.timestamp DESC
    LIMIT 5;
END;
$$;
