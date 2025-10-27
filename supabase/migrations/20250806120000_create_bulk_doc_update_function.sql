/*
  # [Function] Create bulk_update_order_docs
  [This operation creates a new database function to efficiently update document statuses for multiple referrals at once.]
  ## Query Description: [This script defines a new function `bulk_update_order_docs` that accepts an array of order IDs, an array of document keys, a note, and a user email. It iterates through each order, updates the specified documents to 'Complete', and creates a corresponding audit log entry for each change. This is a non-destructive operation that adds new functionality.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function: public.bulk_update_order_docs(text[], text, uuid[], text)
  ## Security Implications:
  - RLS Status: N/A (Function runs with definer's rights)
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: N/A
  - Triggers: N/A
  - Estimated Impact: Low. The function is optimized for bulk operations.
*/
CREATE OR REPLACE FUNCTION public.bulk_update_order_docs(
    doc_keys text[],
    note text,
    order_ids uuid[],
    user_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    order_id uuid;
    doc_key text;
    current_docs_status jsonb;
    patient_name_text text;
BEGIN
    FOREACH order_id IN ARRAY order_ids
    LOOP
        -- Get the current document_status and patient name
        SELECT
            o.document_status,
            p.name
        INTO
            current_docs_status,
            patient_name_text
        FROM orders o
        JOIN patients p ON o.patient_id = p.id
        WHERE o.id = order_id;

        -- Initialize if null
        IF current_docs_status IS NULL THEN
            current_docs_status := '{}'::jsonb;
        END IF;

        -- Update the status for each document key
        FOREACH doc_key IN ARRAY doc_keys
        LOOP
            current_docs_status := jsonb_set(current_docs_status, ARRAY[doc_key], '"Complete"', true);
        END LOOP;

        -- Update the order with the new document_status
        UPDATE orders
        SET document_status = current_docs_status
        WHERE id = order_id;

        -- Create an audit log entry for this order
        INSERT INTO audit_log (action, changed_by, changed_user, details)
        VALUES (
            'mass_doc_update',
            user_email,
            patient_name_text,
            jsonb_build_object(
                'order_id', order_id,
                'documents_updated', doc_keys,
                'note', note
            )
        );
    END LOOP;
END;
$$;
