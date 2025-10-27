-- Drop existing functions to ensure a clean recreation, avoiding signature conflicts.
DROP FUNCTION IF EXISTS public.is_backward(text, text);
DROP FUNCTION IF EXISTS public.get_dashboard_metrics();
DROP FUNCTION IF EXISTS public.get_referrals_paginated(p_limit integer, p_offset integer, p_search_term text, p_stage_filters text[], p_account_filter text);

--
-- Name: is_backward(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--
/*
          # [Function: is_backward]
          Checks if a workflow stage transition is a backward movement.

          ## Query Description: [This is a helper function to determine if a stage change is a regression. It compares the index of two stage names in a predefined array. It is safe to run and has no impact on existing data.]
          
          ## Metadata:
          - Schema-Category: ["Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          [This function does not alter any table structures.]
          
          ## Security Implications:
          - RLS Status: [N/A]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [N/A]
          - Estimated Impact: [Negligible performance impact.]
          */
CREATE OR REPLACE FUNCTION public.is_backward(from_stage text, to_stage text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    stages text[] := array[
        'Referral Received', 'Patient Intake & Demographics', 'Insurance Verification',
        'Clinical Review', 'ATP / PT Assessment', 'Documentation Verification',
        'Preauthorization (PAR)', 'Vendor / Order Processing', 'Delivery & Billing',
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

ALTER FUNCTION public.is_backward(text, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_backward(text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_backward(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_backward(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_backward(text, text) TO service_role;

--
-- Name: get_dashboard_metrics(); Type: FUNCTION; Schema: public; Owner: postgres
--
/*
          # [Function: get_dashboard_metrics]
          Calculates key performance indicators for the main dashboard.

          ## Query Description: [This function computes several metrics for the dashboard. It uses LEFT JOINs to be resilient to missing patient data and handles NULL archive statuses correctly. It is a read-only operation and safe to run.]
          
          ## Metadata:
          - Schema-Category: ["Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          [This function does not alter any table structures.]
          
          ## Security Implications:
          - RLS Status: [Bypassed via SECURITY DEFINER]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Relies on indexes on orders(is_archived, last_stage_change) and workflow_history(changed_at).]
          - Triggers: [N/A]
          - Estimated Impact: [Low. Performs aggregate calculations.]
          */
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE(total_orders bigint, ready_for_par_count bigint, avg_days_in_stage double precision, regressions_7d bigint, total_history_7d bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH active_orders AS (
  SELECT
    o.id,
    o.last_stage_change,
    p.required_documents,
    o.document_status
  FROM
    orders o
    LEFT JOIN patients p ON o.patient_id = p.id
  WHERE
    o.is_archived IS DISTINCT FROM TRUE
),
history_7d AS (
  SELECT
    previous_stage,
    new_stage
  FROM
    workflow_history
  WHERE
    changed_at >= (now() - '7 days'::interval)
),
par_readiness AS (
  SELECT
    o.id,
    (
      SELECT
        bool_and(o.document_status ->> "key" = 'Complete')
      FROM
        unnest(o.required_documents) "key"
    ) AS is_ready
  FROM
    active_orders o
  WHERE
    o.required_documents IS NOT NULL
    AND array_length(o.required_documents, 1) > 0
)
SELECT
  (SELECT count(*) FROM active_orders) AS total_orders,
  (SELECT count(*) FROM par_readiness WHERE par_readiness.is_ready = TRUE) AS ready_for_par_count,
  (SELECT avg(EXTRACT(epoch FROM (now() - active_orders.last_stage_change)) / 86400.0) FROM active_orders WHERE active_orders.last_stage_change IS NOT NULL) AS avg_days_in_stage,
  (SELECT count(*) FROM history_7d WHERE is_backward(history_7d.previous_stage, history_7d.new_stage)) AS regressions_7d,
  (SELECT count(*) FROM history_7d) AS total_history_7d;
$$;

ALTER FUNCTION public.get_dashboard_metrics() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO service_role;


--
-- Name: get_referrals_paginated(...); Type: FUNCTION; Schema: public; Owner: postgres
--
/*
          # [Function: get_referrals_paginated]
          Fetches a paginated and filtered list of referrals for the main list view.

          ## Query Description: [This function retrieves referral records. It uses a LEFT JOIN to ensure referrals are shown even if patient data is missing. It is a read-only operation and safe to run.]
          
          ## Metadata:
          - Schema-Category: ["Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          [This function does not alter any table structures.]
          
          ## Security Implications:
          - RLS Status: [Bypassed via SECURITY DEFINER]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Relies on indexes on orders(is_archived, created_at), patients(name, primary_insurance).]
          - Triggers: [N/A]
          - Estimated Impact: [Low. Paginated query is efficient.]
          */
CREATE OR REPLACE FUNCTION public.get_referrals_paginated(p_limit integer, p_offset integer, p_search_term text DEFAULT NULL::text, p_stage_filters text[] DEFAULT NULL::text[], p_account_filter text DEFAULT NULL::text)
RETURNS SETOF orders
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.*
  FROM orders o
  LEFT JOIN patients p ON o.patient_id = p.id
  WHERE 
    (o.is_archived IS DISTINCT FROM TRUE)
    AND (p_account_filter IS NULL OR p.primary_insurance = p_account_filter)
    AND (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
    AND (
      p_search_term IS NULL OR
      p.name ILIKE '%' || p_search_term || '%' OR
      p.primary_insurance ILIKE '%' || p_search_term || '%' OR
      o.workflow_stage ILIKE '%' || p_search_term || '%'
    )
  ORDER BY o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

ALTER FUNCTION public.get_referrals_paginated(integer, integer, text, text[], text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_referrals_paginated(integer, integer, text, text[], text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_referrals_paginated(integer, integer, text, text[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referrals_paginated(integer, integer, text, text[], text) TO service_role;
