/*
  # [Operation Name]
  [Fixes the `get_recent_activity` function to correctly calculate dashboard metrics.]

  ## Query Description: [This operation drops the existing, faulty `get_recent_activity` function and recreates it with a corrected implementation. The new function avoids incorrect table joins that were causing errors and accurately counts new denials, completed documents, and newly archived referrals from the last 24 hours.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [false]
  
  ## Structure Details:
  [Drops and recreates the `get_recent_activity` function.]
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [N/A]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [Low. The function uses simple count queries on indexed columns.]
*/
drop function if exists get_recent_activity();

create function get_recent_activity()
returns table(new_denials bigint, docs_completed bigint, newly_archived bigint) as $$
begin
    return query
    select
        (select count(*) from denials where created_at >= now() - interval '1 day') as new_denials,
        (
            select count(*)
            from audit_log
            where
                action = 'doc_status_change'
                and (details->>'status' = 'Complete' or details->>'status' = 'complete')
                and timestamp >= now() - interval '1 day'
        ) as docs_completed,
        (select count(*) from orders where is_archived = true and updated_at >= now() - interval '1 day') as newly_archived;
end;
$$ language plpgsql;
