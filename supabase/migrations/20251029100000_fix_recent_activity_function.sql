/*
  # [Fix] Correct the `get_recent_activity` function
  This migration corrects the `get_recent_activity` function to properly calculate dashboard metrics without causing SQL errors.

  ## Query Description: 
  This operation replaces an existing database function. It fixes an error where the function was trying to access a `patient_name` column directly from the `orders` table, which does not exist. The corrected version calculates the required counts without needing to join the `patients` table, making it more efficient and resolving the error.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (can be reverted to a previous version if needed)

  ## Structure Details:
  - Function `get_recent_activity` is being replaced.

  ## Security Implications:
  - RLS Status: Not applicable to this function.
  - Policy Changes: No
  - Auth Requirements: None

  ## Performance Impact:
  - Indexes: Not applicable.
  - Triggers: Not applicable.
  - Estimated Impact: Low. The function is more efficient as it avoids an unnecessary join.
*/
create or replace function get_recent_activity()
returns table (
    new_denials bigint,
    docs_completed bigint,
    newly_archived bigint
)
language sql
as $$
    select
        (select count(*) from denials where denial_date >= now() - interval '24 hours') as new_denials,
        (
            select count(*)
            from audit_log
            where action = 'doc_status_change'
            and (details->>'status') = 'Complete'
            and timestamp >= now() - interval '24 hours'
        ) as docs_completed,
        (
            select count(*)
            from orders
            where is_archived = true
            and updated_at >= now() - interval '24 hours'
            and id in (
                select order_id from workflow_history
                where new_stage = 'Archived' and changed_at >= now() - interval '24 hours'
            )
        ) as newly_archived;
$$;
