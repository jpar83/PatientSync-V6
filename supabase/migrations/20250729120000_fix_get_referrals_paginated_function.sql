-- Drop the existing function to avoid signature conflicts
DROP FUNCTION IF EXISTS get_referrals_paginated(integer,integer,text,text[],text);

-- Recreate the function with a robust, manual JSON build to prevent type errors
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
  patients jsonb
)
AS $$
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
    CASE
      WHEN p.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', p.id,
        'created_at', p.created_at,
        'name', p.name,
        'dob', p.dob,
        'primary_insurance', p.primary_insurance,
        'gender', p.gender,
        'phone_number', p.phone_number,
        'email', p.email,
        'address_line1', p.address_line1,
        'address_line2', p.address_line2,
        'city', p.city,
        'state', p.state,
        'zip', p.zip,
        'policy_number', p.policy_number,
        'group_number', p.group_number,
        'insurance_notes', p.insurance_notes,
        'pcp_name', p.pcp_name,
        'referring_physician', p.referring_physician,
        'source', p.source,
        'archived', p.archived,
        'pcp_phone', p.pcp_phone,
        'preferred_contact_method', p.preferred_contact_method,
        'required_documents', p.required_documents
      )
    END AS patients
  FROM orders o
  LEFT JOIN patients p ON p.id = o.patient_id
  WHERE
    (o.is_archived IS DISTINCT FROM TRUE)
    AND (p_search_term IS NULL OR p.name ILIKE '%' || p_search_term || '%')
    AND (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
    AND (p_account_filter IS NULL OR p.primary_insurance = p_account_filter)
  ORDER BY
    o.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions to the application roles
GRANT EXECUTE ON FUNCTION get_referrals_paginated(integer,integer,text,text[],text) TO anon;
GRANT EXECUTE ON FUNCTION get_referrals_paginated(integer,integer,text,text[],text) TO authenticated;
