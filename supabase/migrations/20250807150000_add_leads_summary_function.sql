/*
# [Function] get_leads_with_summary
This function retrieves all marketing leads and enriches them with details from their most recent touchpoint.

## Query Description:
This query fetches all leads and joins them with their latest touchpoint to provide a summary of recent activity. It is a read-only operation and does not pose any risk to existing data.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables: marketing_leads, marketing_touchpoints
- Function: get_leads_with_summary()

## Security Implications:
- RLS Status: Assumes RLS is enabled on underlying tables. The function runs with the invoker's permissions.
- Policy Changes: No
- Auth Requirements: Authenticated user

## Performance Impact:
- Indexes: Benefits from indexes on `marketing_touchpoints(lead_id, created_at)`.
- Triggers: None
- Estimated Impact: Low impact, expected to be fast for a moderate number of leads and touchpoints.
*/

create or replace function get_leads_with_summary()
returns table (
    id uuid,
    created_at timestamptz,
    name text,
    type text,
    city text,
    state text,
    status text,
    owner_id uuid,
    interests text,
    notes text,
    latest_touchpoint_date timestamptz,
    latest_touchpoint_purpose text
)
language plpgsql
security invoker
as $$
begin
    return query
    select
        ml.id,
        ml.created_at,
        ml.name,
        ml.type,
        ml.city,
        ml.state,
        ml.status,
        ml.owner_id,
        ml.interests,
        ml.notes,
        lt.latest_date,
        lt.latest_purpose
    from
        public.marketing_leads ml
    left join lateral (
        select
            mt.created_at as latest_date,
            mt.purpose as latest_purpose
        from
            public.marketing_touchpoints mt
        where
            mt.lead_id = ml.id
        order by
            mt.created_at desc
        limit 1
    ) lt on true
    order by
        ml.name;
end;
$$;
