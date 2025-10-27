/*
  # [Function] delete_referral_and_dependents
  This function safely and completely deletes a referral (order) and all of its associated records across multiple tables.

  ## Query Description:
  - This is a DANGEROUS operation that permanently removes data.
  - It deletes records from `workflow_history`, `denials`, `equipment`, `regressions`, and `orders`.
  - The associated `patient` record is NOT deleted.
  - This action is irreversible. Backup is strongly recommended before use.

  ## Metadata:
  - Schema-Category: "Dangerous"
  - Impact-Level: "High"
  - Requires-Backup: true
  - Reversible: false

  ## Structure Details:
  - Deletes from: `workflow_history`, `denials`, `equipment`, `regressions`, `orders`
  - Input: `p_order_id` (UUID of the order to delete)

  ## Security Implications:
  - RLS Status: This function runs with the privileges of the user that created it (`SECURITY DEFINER`), bypassing RLS for the deletion operations to ensure all related data is removed.
  - Policy Changes: No
  - Auth Requirements: Should be called by an authenticated user, with frontend logic controlling who can trigger it.

  ## Performance Impact:
  - Indexes: Uses primary keys for deletion, which is efficient.
  - Triggers: No new triggers added.
  - Estimated Impact: Low impact for single deletions.
*/
CREATE OR REPLACE FUNCTION delete_referral_and_dependents(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete from dependent tables first to avoid foreign key violations
    DELETE FROM public.workflow_history WHERE order_id = p_order_id;
    DELETE FROM public.denials WHERE order_id = p_order_id;
    DELETE FROM public.equipment WHERE order_id = p_order_id;
    DELETE FROM public.regressions WHERE order_id = p_order_id;

    -- Finally, delete the main order record
    DELETE FROM public.orders WHERE id = p_order_id;
END;
$$;
