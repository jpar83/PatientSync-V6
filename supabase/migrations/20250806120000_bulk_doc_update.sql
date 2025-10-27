/*
  # [Function] Bulk Update Document Status
  [This operation creates a new database function `bulk_update_document_status` to efficiently update the `document_status` field for multiple orders at once. This is a foundational step for the bulk document update feature.]

  ## Query Description: [This script creates a new RPC function, `bulk_update_document_status`. The function takes an array of order UUIDs and an array of document keys as input. It constructs a JSONB "patch" object (e.g., `{"F2F": "Complete"}`) and merges it with the existing `document_status` for all specified orders in a single, efficient UPDATE statement. This is a safe, non-destructive operation that adds or overwrites keys in the JSONB field.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Function: public.bulk_update_document_status(uuid[], text[])
  
  ## Security Implications:
  - RLS Status: N/A (Function will run with the privileges of the calling user)
  - Policy Changes: No
  - Auth Requirements: authenticated
  
  ## Performance Impact:
  - Indexes: N/A
  - Triggers: N/A
  - Estimated Impact: Low. This function is designed to be efficient for bulk operations, using a single UPDATE statement for multiple rows.
*/
create or replace function public.bulk_update_document_status(
    p_order_ids uuid[],
    p_docs_to_update text[]
)
returns void
language plpgsql
as $$
declare
    patch jsonb;
begin
    -- Create a jsonb object like {"F2F": "Complete", "PT_EVAL": "Complete"}
    select jsonb_object_agg(key, 'Complete')
    into patch
    from unnest(p_docs_to_update) as key;

    if patch is null then
        return;
    end if;

    update public.orders
    set document_status = coalesce(document_status, '{}'::jsonb) || patch
    where id = any(p_order_ids);
end;
$$;
