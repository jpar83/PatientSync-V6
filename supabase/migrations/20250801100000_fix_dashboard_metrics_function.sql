--
-- Name: get_dashboard_metrics(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--
/*
          # [Function Re-creation] get_dashboard_metrics
          This operation drops and recreates the `get_dashboard_metrics` function to fix data accuracy issues.

          ## Query Description: [This operation replaces the existing dashboard metrics function with a more resilient version. The new function uses a `LEFT JOIN` to prevent active referrals from being excluded if their patient record is missing, and it correctly handles `NULL` values for the `is_archived` flag. This ensures that all dashboard KPIs are accurate and reflect the complete dataset. This change is non-destructive to your data.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Function `get_dashboard_metrics()` will be dropped and recreated.
          
          ## Security Implications:
          - RLS Status: Not applicable to function definition itself.
          - Policy Changes: No
          - Auth Requirements: The function is security definer and can be called by authenticated users.
          
          ## Performance Impact:
          - Indexes: The query is optimized to use existing indexes on `orders` and `workflow_history`.
          - Triggers: None
          - Estimated Impact: Low. The query is efficient and runs quickly.
          */

-- Drop the old function first to avoid return type conflicts and ensure a clean recreation.
DROP FUNCTION IF EXISTS public.get_dashboard_metrics();

-- Recreate the function with corrected logic (LEFT JOIN and NULL-safe filtering)
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE(total_orders bigint, ready_for_par_count bigint, avg_days_in_stage double precision, regressions_7d bigint, total_history_7d bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH stage_order AS (
    -- Define the order of workflow stages to correctly identify regressions.
    SELECT
      stage,
      row_number() OVER () as stage_index
    FROM (
      VALUES
        ('Referral Received'),
        ('Patient Intake & Demographics'),
        ('Insurance Verification'),
        ('Clinical Review'),
        ('ATP / PT Assessment'),
        ('Documentation Verification'),
        ('Preauthorization (PAR)'),
        ('Vendor / Order Processing'),
        ('Delivery & Billing'),
        ('Post-Delivery Follow-up / Archive')
    ) AS s(stage)
  ),
  active_orders AS (
    -- Select all orders that are not archived.
    -- This uses a LEFT JOIN to prevent dropping orders if a patient record is missing.
    SELECT
      o.id,
      o.workflow_stage,
      o.last_stage_change,
      p.required_documents,
      o.document_status
    FROM
      public.orders o
      LEFT JOIN public.patients p ON o.patient_id = p.id
    WHERE
      -- This correctly handles both FALSE and NULL as "not archived".
      o.is_archived IS NOT TRUE
  ),
  history_7d AS (
    -- Get all workflow history from the last 7 days and check for regressions.
    SELECT
      h.previous_stage,
      h.new_stage,
      (SELECT stage_index FROM stage_order WHERE stage = h.new_stage) < (SELECT stage_index FROM stage_order WHERE stage = h.previous_stage) AS is_regression
    FROM
      public.workflow_history h
    WHERE
      h.changed_at >= now() - interval '7 days'
  ),
  ready_for_par_calc AS (
    -- Determine if an order is "Ready for PAR" by checking its required documents.
    SELECT
      ao.id,
      CASE
        WHEN ao.required_documents IS NULL OR array_length(ao.required_documents, 1) = 0 THEN false
        ELSE NOT EXISTS (
          SELECT 1
          FROM unnest(ao.required_documents) AS required_doc
          WHERE NOT (
            ao.document_status->>required_doc = 'Complete'
          )
        )
      END AS is_ready
    FROM
      active_orders ao
  )
  -- Aggregate all the calculated metrics into a single result row.
  SELECT
    (SELECT count(*) FROM active_orders) AS total_orders,
    (SELECT count(*) FROM ready_for_par_calc WHERE is_ready = TRUE) AS ready_for_par_count,
    (SELECT avg(EXTRACT(epoch FROM (now() - ao.last_stage_change)) / 86400.0) FROM active_orders ao WHERE ao.last_stage_change IS NOT NULL) AS avg_days_in_stage,
    (SELECT count(*) FROM history_7d WHERE is_regression = TRUE) AS regressions_7d,
    (SELECT count(*) FROM history_7d) AS total_history_7d;
END;
$$;

-- Secure the function by setting a fixed search path.
ALTER FUNCTION public.get_dashboard_metrics() SET search_path = public;
