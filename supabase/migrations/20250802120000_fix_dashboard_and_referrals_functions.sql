-- Drop existing functions to be replaced
DROP FUNCTION IF EXISTS public.get_dashboard_metrics();
DROP FUNCTION IF EXISTS public.get_referrals_paginated(text,text[],text,integer,integer);

-- Recreate get_dashboard_metrics with LEFT JOIN and NULL-safe filter
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE(total_orders bigint, ready_for_par_count bigint, avg_days_in_stage double precision, regressions_7d bigint, total_history_7d bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH active_orders AS (
    SELECT
      o.id,
      o.workflow_stage,
      o.last_stage_change,
      p.required_documents,
      o.document_status
    FROM
      public.orders o
    LEFT JOIN
      public.patients p ON o.patient_id = p.id
    WHERE
      o.is_archived IS NOT TRUE -- This handles both FALSE and NULL
  ),
  par_ready AS (
    SELECT
      ao.id
    FROM
      active_orders ao
    WHERE
      ao.required_documents IS NOT NULL
      AND array_length(ao.required_documents, 1) > 0
      AND (
        SELECT bool_and(ao.document_status->>key = 'Complete')
        FROM unnest(ao.required_documents) AS key
      )
  ),
  history_7d AS (
      SELECT *
      FROM public.workflow_history
      WHERE changed_at >= now() - interval '7 days'
  )
  SELECT
    (SELECT count(*) FROM active_orders)::bigint AS total_orders,
    (SELECT count(*) FROM par_ready)::bigint AS ready_for_par_count,
    (SELECT COALESCE(avg(EXTRACT(EPOCH FROM (now() - last_stage_change)) / 86400), 0) FROM active_orders WHERE last_stage_change IS NOT NULL)::double precision AS avg_days_in_stage,
    (SELECT count(*) FROM history_7d h WHERE is_backward(h.previous_stage, h.new_stage))::bigint AS regressions_7d,
    (SELECT count(*) FROM history_7d)::bigint AS total_history_7d;
END;
$$;

-- Recreate get_referrals_paginated with LEFT JOIN and NULL-safe filter
CREATE OR REPLACE FUNCTION public.get_referrals_paginated(
    p_search_term text,
    p_stage_filters text[],
    p_account_filter text,
    p_limit integer,
    p_offset integer
)
RETURNS TABLE(
    -- All columns from orders
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
    created_at timestamp with time zone,
    referral_source text,
    document_status jsonb,
    -- The patient data as a single JSON object
    patients json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
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
    o.created_at,
    o.referral_source,
    o.document_status,
    json_build_object(
      'id', p.id,
      'name', p.name,
      'dob', p.dob,
      'primary_insurance', p.primary_insurance,
      'required_documents', p.required_documents
      -- Add other patient fields as needed by the frontend
    ) AS patients
  FROM
    public.orders AS o
  LEFT JOIN
    public.patients AS p ON o.patient_id = p.id
  WHERE
    o.is_archived IS NOT TRUE -- This handles both FALSE and NULL
    AND (p_search_term IS NULL OR p_search_term = '' OR p.name ILIKE '%' || p_search_term || '%')
    AND (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
    AND (p_account_filter IS NULL OR p.primary_insurance = p_account_filter)
  ORDER BY
    p.name ASC, o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
