-- Drop existing functions to avoid signature conflicts
DROP FUNCTION IF EXISTS get_referrals_paginated(TEXT, TEXT[], TEXT, INT, INT);
DROP FUNCTION IF EXISTS get_dashboard_metrics();

-- Create a more robust function to get paginated referrals
CREATE OR REPLACE FUNCTION get_referrals_paginated(
    p_search_term TEXT DEFAULT NULL,
    p_stage_filters TEXT[] DEFAULT NULL,
    p_account_filter TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    -- Duplicating columns from 'orders' table
    id uuid,
    patient_id uuid,
    chair_type text,
    accessories text,
    workflow_stage text,
    status text,
    rep_name text,
    referral_date timestamp with time zone,
    is_archived boolean,
    last_stage_change timestamp with time zone,
    last_stage_note text,
    vendor_id uuid,
    referral_source text,
    diagnosis_code text,
    clinical_notes text,
    mobility_needs text,
    equipment_requested text,
    pt_eval_date date,
    f2f_date date,
    assigned_rep text,
    market_rep text,
    date_received timestamp with time zone,
    authorization_number text,
    order_date date,
    document_status jsonb,
    created_at timestamp with time zone,
    -- Nested patient and vendor data as JSONB
    patients jsonb,
    vendors jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id, o.patient_id, o.chair_type, o.accessories, o.workflow_stage, o.status, o.rep_name, o.referral_date,
        o.is_archived, o.last_stage_change, o.last_stage_note, o.vendor_id, o.referral_source, o.diagnosis_code,
        o.clinical_notes, o.mobility_needs, o.equipment_requested, o.pt_eval_date, o.f2f_date, o.assigned_rep,
        o.market_rep, o.date_received, o.authorization_number, o.order_date, o.document_status, o.created_at,
        to_jsonb(p) as patients,
        to_jsonb(v) as vendors
    FROM
        orders o
    LEFT JOIN
        patients p ON o.patient_id = p.id
    LEFT JOIN
        vendors v ON o.vendor_id = v.id
    WHERE
        (o.is_archived IS DISTINCT FROM TRUE)
        AND (p_search_term IS NULL OR (
            p.name ILIKE '%' || p_search_term || '%'
            OR p.primary_insurance ILIKE '%' || p_search_term || '%'
            OR o.workflow_stage ILIKE '%' || p_search_term || '%'
        ))
        AND (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
        AND (p_account_filter IS NULL OR p.primary_insurance = p_account_filter)
    ORDER BY
        p.name ASC, o.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ SECURITY DEFINER SET search_path = public;

-- Create a more robust function to get dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE (
    total_orders BIGINT,
    ready_for_par_count BIGINT,
    avg_days_in_stage NUMERIC,
    regressions_7d BIGINT,
    total_history_7d BIGINT
)
LANGUAGE sql STABLE
AS $$
WITH active_orders AS (
    SELECT o.*, p.required_documents
    FROM orders o
    LEFT JOIN patients p ON o.patient_id = p.id
    WHERE o.is_archived IS DISTINCT FROM TRUE
),
par_readiness AS (
    SELECT
        ao.id
    FROM active_orders ao
    WHERE ao.required_documents IS NOT NULL
      AND array_length(ao.required_documents, 1) > 0
      AND (
        SELECT bool_and(ao.document_status ->> doc_key = 'Complete')
        FROM unnest(ao.required_documents) as doc_key
      )
)
SELECT
    (SELECT COUNT(*) FROM active_orders) as total_orders,
    (SELECT COUNT(*) FROM par_readiness) as ready_for_par_count,
    COALESCE((SELECT AVG(EXTRACT(DAY FROM (now() - last_stage_change))) FROM active_orders WHERE last_stage_change IS NOT NULL), 0)::NUMERIC(10, 2) as avg_days_in_stage,
    (SELECT COUNT(*) FROM workflow_history WHERE changed_at > (now() - interval '7 days') AND is_backward(previous_stage, new_stage)) as regressions_7d,
    (SELECT COUNT(*) FROM workflow_history WHERE changed_at > (now() - interval '7 days')) as total_history_7d;
$$ SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_referrals_paginated(TEXT, TEXT[], TEXT, INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO anon, authenticated;
