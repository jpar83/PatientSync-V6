/*
  # [Enhancement] Update Dashboard Metrics for Regressions
  [This operation updates the `get_dashboard_metrics` function to source its regression count from the new `public.regressions` table, improving accuracy and efficiency.]
  ## Query Description: [This is a safe, non-destructive operation that replaces an existing database function. It modifies the logic for calculating the 7-day regression count to use the new, dedicated table instead of deriving it from the general workflow history.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function: public.get_dashboard_metrics()
  ## Security Implications:
  - RLS Status: N/A
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: N/A
  - Triggers: N/A
  - Estimated Impact: Low. The new query is more direct and should be slightly more performant.
*/
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE(total_orders bigint, ready_for_par_count bigint, avg_days_in_stage double precision, regressions_7d integer, total_history_7d integer)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT count(*) FROM public.orders WHERE is_archived = false),
        (SELECT count(*)
         FROM public.orders o
         JOIN public.patients p ON o.patient_id = p.id
         WHERE o.is_archived = false
           AND p.required_documents IS NOT NULL
           AND (SELECT count(*) FROM jsonb_array_elements(p.required_documents::jsonb)) > 0
           AND (SELECT count(*)
                FROM jsonb_each_text(o.document_status) doc(key, value)
                WHERE doc.key = ANY(jsonb_array_elements_text(p.required_documents::jsonb))
                  AND doc.value = 'Complete'
               ) = (SELECT count(*) FROM jsonb_array_elements_text(p.required_documents::jsonb))
        ),
        (SELECT avg(EXTRACT(EPOCH FROM (now() - last_stage_change))/86400) FROM public.orders WHERE is_archived = false),
        (SELECT count(*)::integer FROM public.regressions WHERE created_at >= (now() - '7 days'::interval)),
        (SELECT count(*)::integer FROM public.workflow_history WHERE changed_at >= (now() - '7 days'::interval));
END;
$$;
