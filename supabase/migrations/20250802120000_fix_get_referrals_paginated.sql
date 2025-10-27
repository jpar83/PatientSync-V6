-- First, drop the existing function to avoid conflicts when changing the return type or parameters.
-- This is necessary because the old function might have a different structure.
DROP FUNCTION IF EXISTS get_referrals_paginated(integer,integer,text,text[],text);

-- Then, create the new, corrected function with LEFT JOIN and NULL-safe filters.
CREATE OR REPLACE FUNCTION get_referrals_paginated(
    p_limit integer,
    p_offset integer,
    p_search_term text DEFAULT NULL,
    p_stage_filters text[] DEFAULT NULL,
    p_account_filter text DEFAULT NULL
)
RETURNS TABLE(
    -- Re-defining all columns from the 'orders' table to ensure a stable return type
    id uuid,
    created_at timestamp with time zone,
    patient_id uuid,
    chair_type text,
    accessories text,
    workflow_stage text,
    status text,
    rep_name text,
    referral_date date,
    is_archived boolean,
    last_stage_change timestamp with time zone,
    last_stage_note text,
    vendor_id uuid,
    referral_source text,
    document_status jsonb,
    -- The joined 'patients' record as a single JSON object
    patients json
)
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
        o.document_status,
        -- Use row_to_json to aggregate patient data into a single JSON object.
        -- This handles cases where the patient might be NULL due to the LEFT JOIN.
        row_to_json(p.*) as patients
    FROM
        orders o
    -- Use LEFT JOIN to ensure orders are returned even if the patient record is missing or inaccessible.
    LEFT JOIN
        patients p ON o.patient_id = p.id
    WHERE
        -- Use IS DISTINCT FROM TRUE to correctly handle both FALSE and NULL values for is_archived.
        (o.is_archived IS DISTINCT FROM TRUE)
        -- Apply filters only if they are provided.
        AND (p_search_term IS NULL OR p.name ILIKE '%' || p_search_term || '%')
        AND (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
        AND (p_account_filter IS NULL OR p.primary_insurance = p_account_filter)
    ORDER BY
        o.created_at DESC
    LIMIT
        p_limit
    OFFSET
        p_offset;
END;
$$
LANGUAGE plpgsql
-- Use SECURITY DEFINER to run with the permissions of the function owner, bypassing RLS for this specific query if needed.
SECURITY DEFINER
-- Explicitly set the search_path to prevent potential hijacking and resolve security warnings.
SET search_path = public;

-- Grant execution rights to the authenticated role so the app can call this function.
GRANT EXECUTE ON FUNCTION get_referrals_paginated(integer,integer,text,text[],text) TO authenticated;
