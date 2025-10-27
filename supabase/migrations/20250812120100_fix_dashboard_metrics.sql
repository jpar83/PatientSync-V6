/*
  # [Function Update] Rebuild Dashboard Metrics Function
  [This operation rebuilds the core database function used to power the main dashboard metrics. It updates the logic to use the new `regressions` table and ensures all calculations are accurate with the current schema.]
  ## Query Description: [This is a safe, non-destructive update. It replaces an existing function with a new version. It does not modify any of your data. This is required to fix the dashboard, which is currently showing a "No Data" error due to an outdated query.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
  ## Structure Details:
  - Function: public.get_dashboard_metrics()
  ## Security Implications:
  - RLS Status: N/A
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: N/A
  - Triggers: N/A
  - Estimated Impact: Low. The function performs aggregate queries which are generally fast on small-to-medium datasets.
*/

DROP FUNCTION IF EXISTS public.get_dashboard_metrics();

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE(total_orders bigint, ready_for_par_count bigint, avg_days_in_stage double precision, regressions_7d bigint, total_history_7d bigint)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.orders WHERE is_archived = false) AS total_orders,
    (
      SELECT count(*)
      FROM public.orders o
      JOIN public.patients p ON o.patient_id = p.id
      WHERE
        o.is_archived = false AND
        p.required_documents IS NOT NULL AND
        array_length(p.required_documents, 1) > 0 AND
        (
          SELECT count(*)
          FROM jsonb_object_keys(o.document_status) key
          WHERE o.document_status->>key = 'Complete' AND key = ANY(p.required_documents)
        ) = array_length(p.required_documents, 1)
    ) AS ready_for_par_count,
    (
      SELECT avg(EXTRACT(epoch FROM (now() - o.last_stage_change)) / 86400.0)
      FROM public.orders o
      WHERE o.is_archived = false AND o.last_stage_change IS NOT NULL
    ) AS avg_days_in_stage,
    (
      SELECT count(*)
      FROM public.regressions r
      WHERE r.created_at >= now() - interval '7 days'
    ) AS regressions_7d,
    (
      SELECT count(*)
      FROM public.workflow_history wh
      WHERE wh.changed_at >= now() - interval '7 days'
    ) AS total_history_7d;
END;
$$;
