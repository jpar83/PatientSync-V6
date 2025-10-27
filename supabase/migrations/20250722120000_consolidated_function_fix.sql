/*
  # [Function] Consolidated Function Fix
  [This script drops and recreates the primary database functions to fix syntax errors and ensure they match the application's requirements.]

  ## Query Description: [This operation will drop and recreate the 'global_search' and 'compare_patient_records_batch' functions. This is a safe, non-destructive change that only affects function definitions and has no impact on existing data. It is necessary to fix a syntax error in the previous migration.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Drops: public.global_search(text), public.compare_patient_records_batch(jsonb)
  - Creates: public.global_search(text), public.compare_patient_records_batch(jsonb)
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [N/A]
  
  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [None. Replaces existing function definitions.]
*/

-- Drop existing functions to prevent signature conflicts
DROP FUNCTION IF EXISTS public.global_search(text);
DROP FUNCTION IF EXISTS public.compare_patient_records_batch(jsonb);


-- Recreate the batch comparison function for imports
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
    existing_record record;
    differences jsonb;
    existing_record_json jsonb;
BEGIN
    FOR new_record IN SELECT * FROM jsonb_array_elements(new_data_batch)
    LOOP
        SELECT *
        INTO existing_record
        FROM public.patients
        WHERE public.patients.email = (new_record->>'email')::text;

        IF FOUND THEN
            -- Create a JSON object from the existing record for comparison
            existing_record_json := jsonb_strip_nulls(to_jsonb(existing_record));

            -- Find differences between the new record and the existing one
            SELECT jsonb_agg(jsonb_build_object('field', key, 'old_value', existing_record_json->>key, 'new_value', value))
            INTO differences
            FROM jsonb_each_text(new_record)
            WHERE new_record->>key IS DISTINCT FROM existing_record_json->>key;
            
            IF jsonb_array_length(COALESCE(differences, '[]'::jsonb)) > 0 THEN
                RETURN QUERY SELECT
                    (new_record->>'email')::text,
                    'exists'::text,
                    COALESCE(differences, '[]'::jsonb),
                    jsonb_build_object(
                        'id', existing_record.id,
                        'name', existing_record.name,
                        'email', existing_record.email
                    );
            END IF;
        ELSE
            -- This case is for new records, though the app logic separates them first.
            -- Returning this ensures the function doesn't fail if a new record is passed.
            RETURN QUERY SELECT
                (new_record->>'email')::text,
                'new'::text,
                '[]'::jsonb,
                null::jsonb;
        END IF;
    END LOOP;
END;
$$;

-- Recreate the global search function with corrected UNION ALL syntax
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE(id text, type text, name text, description text, path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY (
        SELECT
            p.id::text,
            'patient'::text AS type,
            p.name,
            'Patient Record - ' || p.email AS description,
            '/patients?focus=' || p.id::text AS path
        FROM
            public.patients p
        WHERE
            p.name ILIKE '%' || p_search_term || '%' OR p.email ILIKE '%' || p_search_term || '%'

        UNION ALL

        SELECT
            o.id::text,
            'order'::text AS type,
            pat.name,
            'Referral - ' || o.workflow_stage AS description,
            '/referrals?order_id=' || o.id::text AS path
        FROM
            public.orders o
        JOIN
            public.patients pat ON o.patient_id = pat.id
        WHERE
            pat.name ILIKE '%' || p_search_term || '%'

        UNION ALL

        SELECT
            a.id::text,
            'audit'::text AS type,
            a.action,
            'Audit Event - by ' || a.changed_by AS description,
            '/audit-log?focus=' || a.id::text AS path
        FROM
            public.audit_log a
        WHERE
            a.action ILIKE '%' || p_search_term || '%' OR a.changed_by ILIKE '%' || p_search_term || '%'
    );
END;
$$;
