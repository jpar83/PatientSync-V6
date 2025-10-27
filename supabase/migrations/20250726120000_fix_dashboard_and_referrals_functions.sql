-- Helper function to determine if a stage change is a regression
CREATE OR REPLACE FUNCTION is_backward(from_stage text, to_stage text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  stages text[] := array[
    'Referral Received',
    'Patient Intake & Demographics',
    'Insurance Verification',
    'Clinical Review',
    'ATP / PT Assessment',
    'Documentation Verification',
    'Preauthorization (PAR)',
    'Vendor / Order Processing',
    'Delivery & Billing',
    'Post-Delivery Follow-up / Archive'
  ];
  from_idx int;
  to_idx int;
BEGIN
  from_idx := array_position(stages, from_stage);
  to_idx := array_position(stages, to_stage);
  IF from_idx IS NULL OR to_idx IS NULL THEN
    RETURN false;
  END IF;
  RETURN to_idx < from_idx;
END;
$$;

-- Drop the old function to be safe
DROP FUNCTION IF EXISTS get_dashboard_metrics();

-- Recreate the dashboard metrics function with LEFT JOIN and NULL-safe filters
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE(total_orders bigint, ready_for_par_count bigint, avg_days_in_stage numeric, regressions_7d bigint, total_history_7d bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH active_orders AS (
    SELECT 
      o.id,
      o.last_stage_change,
      o.document_status,
      p.required_documents
    FROM orders o
    LEFT JOIN patients p ON o.patient_id = p.id
    WHERE o.is_archived IS NOT TRUE
  ),
  par_readiness AS (
    SELECT
      ao.id,
      (
        SELECT bool_and(ao.document_status->>key = 'Complete')
        FROM unnest(ao.required_documents) as key
      ) as is_ready
    FROM active_orders ao
    WHERE ao.required_documents IS NOT NULL AND array_length(ao.required_documents, 1) > 0
  ),
  history_7d AS (
    SELECT 
      wh.previous_stage,
      wh.new_stage
    FROM workflow_history wh
    WHERE wh.changed_at >= now() - interval '7 days'
  )
  SELECT
    (SELECT COUNT(*) FROM active_orders) as total_orders,
    (SELECT COUNT(*) FROM par_readiness WHERE is_ready = TRUE) as ready_for_par_count,
    COALESCE((SELECT AVG(EXTRACT(DAY FROM (now() - ao.last_stage_change))) FROM active_orders ao WHERE ao.last_stage_change IS NOT NULL), 0) as avg_days_in_stage,
    (SELECT COUNT(*) FROM history_7d h WHERE is_backward(h.previous_stage, h.new_stage)) as regressions_7d,
    (SELECT COUNT(*) FROM history_7d) as total_history_7d;
END;
$$;

-- Drop the old function to be safe
DROP FUNCTION IF EXISTS get_referrals_paginated(text,text[],text,integer,integer);

-- Recreate the referrals pagination function with LEFT JOIN and NULL-safe filters
CREATE OR REPLACE FUNCTION get_referrals_paginated(
    p_search_term text,
    p_stage_filters text[],
    p_account_filter text,
    p_limit integer,
    p_offset integer
)
RETURNS TABLE (
    id uuid, created_at timestamptz, patient_id uuid, chair_type text, accessories text,
    workflow_stage text, status text, rep_name text, referral_date date, is_archived boolean,
    last_stage_change timestamptz, last_stage_note text, vendor_id uuid, referral_source text,
    diagnosis_code text, clinical_notes text, mobility_needs text, equipment_requested text,
    pt_eval_date date, f2f_date date, assigned_rep text, market_rep text, date_received timestamptz,
    authorization_number text, order_date date, document_status jsonb,
    patients jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id, o.created_at, o.patient_id, o.chair_type, o.accessories, o.workflow_stage,
        o.status, o.rep_name, o.referral_date, o.is_archived, o.last_stage_change,
        o.last_stage_note, o.vendor_id, o.referral_source, o.diagnosis_code, o.clinical_notes,
        o.mobility_needs, o.equipment_requested, o.pt_eval_date, o.f2f_date, o.assigned_rep,
        o.market_rep, o.date_received, o.authorization_number, o.order_date, o.document_status,
        to_jsonb(p) as patients
    FROM
        orders o
    LEFT JOIN
        patients p ON o.patient_id = p.id
    WHERE
        o.is_archived IS NOT TRUE
        AND (p_search_term IS NULL OR p.name ILIKE ('%' || p_search_term || '%'))
        AND (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
        AND (p_account_filter IS NULL OR p.primary_insurance = p_account_filter)
    ORDER BY
        p.name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

ALTER FUNCTION get_dashboard_metrics() SET search_path = public;
ALTER FUNCTION get_referrals_paginated(text,text[],text,integer,integer) SET search_path = public;
ALTER FUNCTION is_backward(text,text) SET search_path = public;
