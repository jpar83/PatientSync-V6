-- Drop the function if it exists, to avoid signature mismatch errors
DROP FUNCTION IF EXISTS get_referrals_paginated(integer, integer, text, text[], text);

-- Create the robust, NULL-safe, and secure function with the correct return shape
CREATE OR REPLACE FUNCTION get_referrals_paginated(
    p_limit integer,
    p_offset integer,
    p_search_term text DEFAULT NULL,
    p_stage_filters text[] DEFAULT NULL,
    p_account_filter text DEFAULT NULL
)
RETURNS TABLE (
    -- Replicate the columns from the 'orders' table
    id uuid,
    created_at timestamptz,
    patient_id uuid,
    chair_type text,
    accessories text,
    workflow_stage text,
    status text,
    rep_name text,
    referral_date date,
    is_archived boolean,
    last_stage_change timestamptz,
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
    date_received date,
    authorization_number text,
    order_date date,
    document_status jsonb,
    -- IMPORTANT: Use row_to_json to bundle patient data, aliased as 'patients'
    patients jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.created_at,
        o.patient_id,
        o.chair_type,
        o.accessories,
        o.workflow_stage,
        o.status,
        o.rep_name,
        o.referral_date,
        o.is_archived,
        o.last_stage_change,
        o.last_stage_note,
        o.vendor_id,
        o.referral_source,
        o.diagnosis_code,
        o.clinical_notes,
        o.mobility_needs,
        o.equipment_requested,
        o.pt_eval_date,
        o.f2f_date,
        o.assigned_rep,
        o.market_rep,
        o.date_received,
        o.authorization_number,
        o.order_date,
        o.document_status,
        -- Use row_to_json to bundle patient data, aliased as 'patients'
        row_to_json(p.*) AS patients
    FROM
        orders o
    LEFT JOIN
        patients p ON o.patient_id = p.id
    WHERE
        -- NULL-safe filter for archived records
        (o.is_archived IS DISTINCT FROM TRUE)
        AND
        -- Stage filter (if provided)
        (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
        AND
        -- Account/Insurance filter (if provided)
        (p_account_filter IS NULL OR p.primary_insurance ILIKE '%' || p_account_filter || '%')
        AND
        -- Search term filter (if provided)
        (
            p_search_term IS NULL OR p_search_term = '' OR (
                p.name ILIKE '%' || p_search_term || '%'
                OR p.primary_insurance ILIKE '%' || p_search_term || '%'
                OR o.workflow_stage ILIKE '%' || p_search_term || '%'
            )
        )
    ORDER BY
        p.name ASC, o.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$
-- Use SECURITY DEFINER to bypass RLS for this read-only function
-- Set a specific search_path to prevent security vulnerabilities
SECURITY DEFINER
SET search_path = public;

-- Grant execution rights to the application roles
GRANT EXECUTE ON FUNCTION get_referrals_paginated(integer, integer, text, text[], text) TO anon;
GRANT EXECUTE ON FUNCTION get_referrals_paginated(integer, integer, text, text[], text) TO authenticated;
