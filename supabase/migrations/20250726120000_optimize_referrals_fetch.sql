/*
# [Function] get_referrals_paginated
This function provides a paginated, searchable, and filterable view of active referrals. It's designed to be the primary data source for the main "Referrals" list, ensuring high performance even with large datasets by handling all complex logic on the server.

## Query Description:
This function is safe to run. It is a read-only operation that queries the `orders` and `patients` tables. It does not modify any data. It replaces the previous method of fetching all data to the client, significantly reducing network load and improving application responsiveness.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (can be dropped and recreated)

## Structure Details:
- Tables read: `orders`, `patients`
- Returns: A table including a `total_count` and a subset of columns from `orders` and `patients`.

## Security Implications:
- RLS Status: The function will respect existing Row Level Security policies for the user calling it.
- Policy Changes: No
- Auth Requirements: Assumes it will be called by an authenticated user.

## Performance Impact:
- Indexes: This function will benefit from indexes on `patients(name)`, `patients(primary_insurance)`, `orders(is_archived)`, and `orders(workflow_stage)`.
- Triggers: None
- Estimated Impact: High positive impact. Drastically reduces query time and data transfer for the Referrals page.
*/
DROP FUNCTION IF EXISTS get_referrals_paginated(TEXT, TEXT[], TEXT, INT, INT);

CREATE OR REPLACE FUNCTION get_referrals_paginated(
    p_search_term TEXT,
    p_stage_filters TEXT[],
    p_account_filter TEXT,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE (
    total_count BIGINT,
    -- Replicating the shape of the original query result for minimal frontend changes
    id uuid,
    created_at timestamptz,
    patient_id uuid,
    is_archived boolean,
    last_stage_change timestamptz,
    last_stage_note text,
    rep_name text,
    workflow_stage text,
    status text,
    chair_type text,
    accessories text,
    referral_date text,
    patient_name text,
    primary_insurance text,
    document_status jsonb,
    patients jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_orders AS (
        SELECT o.*, p.name as p_name, p.primary_insurance as p_insurance, to_jsonb(p) as p_json
        FROM orders o
        JOIN patients p ON o.patient_id = p.id
        WHERE
            o.is_archived = false
            AND (p_search_term IS NULL OR p_search_term = '' OR p.name ILIKE ('%' || p_search_term || '%'))
            AND (p_stage_filters IS NULL OR array_length(p_stage_filters, 1) IS NULL OR o.workflow_stage = ANY(p_stage_filters))
            AND (p_account_filter IS NULL OR p_account_filter = '' OR p.primary_insurance = p_account_filter)
    )
    SELECT
        (SELECT count(*) FROM filtered_orders) AS total_count,
        fo.id,
        fo.created_at,
        fo.patient_id,
        fo.is_archived,
        fo.last_stage_change,
        fo.last_stage_note,
        fo.rep_name,
        fo.workflow_stage,
        fo.status,
        fo.chair_type,
        fo.accessories,
        fo.referral_date,
        fo.p_name as patient_name,
        fo.p_insurance as primary_insurance,
        fo.document_status,
        fo.p_json as patients
    FROM filtered_orders fo
    ORDER BY fo.p_name ASC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
END;
$$;
