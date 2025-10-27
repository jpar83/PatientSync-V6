/*
# [Function] delete_referral_and_dependents
Deletes a referral (order) and all of its associated dependent records.

## Query Description: 
This function performs a cascading delete operation. When an order ID is provided, it will permanently remove the corresponding record from the `orders` table and all related entries in `workflow_history`, `denials`, and `equipment`. This action is irreversible and should be used with caution as it leads to permanent data loss for the specified referral.

## Metadata:
- Schema-Category: "Dangerous"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Tables affected: `orders`, `workflow_history`, `denials`, `equipment`

## Security Implications:
- RLS Status: Assumes RLS is enabled. The function runs with the invoker's permissions.
- Policy Changes: No
- Auth Requirements: User must have DELETE permissions on the affected tables.

## Performance Impact:
- Indexes: Uses primary keys for deletion, which is efficient.
- Triggers: No new triggers added.
- Estimated Impact: Low impact for single deletions. High impact if run in a loop on many records.
*/

create or replace function delete_referral_and_dependents(p_order_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  -- Delete dependent records first to respect foreign key constraints if they exist.
  delete from public.workflow_history where order_id = p_order_id;
  delete from public.denials where order_id = p_order_id;
  delete from public.equipment where order_id = p_order_id;
  
  -- Finally, delete the main order record.
  delete from public.orders where id = p_order_id;
end;
$$;
