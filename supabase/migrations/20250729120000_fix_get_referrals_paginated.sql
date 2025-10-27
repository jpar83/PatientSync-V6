-- Drop the function first to avoid signature mismatch errors which have occurred before.
DROP FUNCTION IF EXISTS get_referrals_paginated(integer,integer,text,text[],text);

-- Create or replace the function with the correct, robust logic.
-- This version uses LEFT JOIN and is NULL-safe for the archive filter.
-- It explicitly builds the patient JSON to avoid type casting issues.
CREATE OR REPLACE FUNCTION get_referrals_paginated(
  p_limit integer, 
  p_offset integer,
  p_search_term text DEFAULT NULL,
  p_stage_filters text[] DEFAULT NULL,
  p_account_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  patient_id uuid,
  is_archived boolean,
  last_stage_change timestamptz,
  last_stage_note text,
  rep_name text,
  workflow_stage text,
  referral_date timestamptz,
  primary_insurance text,
  vendor_id uuid,
  referral_source text,
  document_status jsonb,
  patients jsonb -- This must match the client's expectation
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.created_at,
    o.patient_id,
    o.is_archived,
    o.last_stage_change,
    o.last_stage_note,
    o.rep_name,
    o.workflow_stage,
    o.referral_date,
    o.primary_insurance,
    o.vendor_id,
    o.referral_source,
    o.document_status,
    -- Manually build the patient object to avoid type casting issues with row_to_json and arrays
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'dob', p.dob,
      'primary_insurance', p.primary_insurance,
      'required_documents', p.required_documents
      -- Add any other patient fields the UI needs here
    ) AS patients
  FROM orders o
  LEFT JOIN patients p ON p.id = o.patient_id
  WHERE 
    (o.is_archived IS DISTINCT FROM TRUE)
    AND (p_search_term IS NULL OR p.name ILIKE '%' || p_search_term || '%')
    AND (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
    AND (p_account_filter IS NULL OR p.primary_insurance = p_account_filter)
  ORDER BY o.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions to the application roles to ensure it can be called.
GRANT EXECUTE ON FUNCTION get_referrals_paginated(integer,integer,text,text[],text) TO anon;
GRANT EXECUTE ON FUNCTION get_referrals_paginated(integer,integer,text,text[],text) TO authenticated;
