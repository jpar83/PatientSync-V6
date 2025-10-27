/*
  # [Function Creation] Create bulk_update_order_docs function
  [This operation creates a new database function to allow updating document statuses for multiple referrals at once.]

  ## Query Description: [This script creates the 'bulk_update_order_docs' function, which is required for the "Update Docs" feature in the bulk actions menu. It is a safe, non-destructive operation that only adds new functionality to the database. Without this function, the bulk document update feature will fail.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Function: public.bulk_update_order_docs(uuid[], text[], text, text)
  
  ## Security Implications:
  - RLS Status: N/A (Function security)
  - Policy Changes: No
  - Auth Requirements: The function uses SECURITY DEFINER to perform updates.
  
  ## Performance Impact:
  - Indexes: N/A
  - Triggers: N/A
  - Estimated Impact: Low. Performance depends on the number of orders updated in a single call.
*/
CREATE OR REPLACE FUNCTION public.bulk_update_order_docs(
    p_order_ids uuid[],
    p_doc_keys text[],
    p_note text,
    p_user_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_id uuid;
    current_docs jsonb;
    updated_docs jsonb;
    doc_key text;
    patient_name_text text;
    patient_id_uuid uuid;
BEGIN
    -- Loop through each order ID provided
    FOREACH order_id IN ARRAY p_order_ids
    LOOP
        -- Get the current document_status and patient info for the order
        SELECT
            o.document_status,
            p.name,
            p.id
        INTO
            current_docs,
            patient_name_text,
            patient_id_uuid
        FROM public.orders o
        JOIN public.patients p ON o.patient_id = p.id
        WHERE o.id = order_id;

        -- Initialize if null
        IF current_docs IS NULL THEN
            current_docs := '{}'::jsonb;
        END IF;

        updated_docs := current_docs;

        -- Update the status for each document key provided
        FOREACH doc_key IN ARRAY p_doc_keys
        LOOP
            updated_docs := jsonb_set(updated_docs, ARRAY[doc_key], '"Complete"', true);
        END LOOP;

        -- Update the order record
        UPDATE public.orders
        SET document_status = updated_docs
        WHERE id = order_id;

        -- Log the bulk action in the audit trail for each affected order
        INSERT INTO public.audit_log (action, changed_by, changed_user, details)
        VALUES (
            'doc_status_change_bulk',
            p_user_email,
            patient_name_text,
            jsonb_build_object(
                'patient_id', patient_id_uuid,
                'order_id', order_id,
                'updated_docs', p_doc_keys,
                'note', p_note
            )
        );
    END LOOP;
END;
$$;
