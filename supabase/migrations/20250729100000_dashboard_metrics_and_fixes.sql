/*
          # [Function] get_dashboard_metrics
          Creates a new RPC function to aggregate key performance indicators for the main dashboard. This is a performance optimization to avoid fetching large datasets on the client.

          ## Query Description: "This operation creates a new, safe, read-only function in the database. It has no impact on existing data and is designed to improve application performance."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Creates a new function: `get_dashboard_metrics()`
          
          ## Security Implications:
          - RLS Status: Not Applicable
          - Policy Changes: No
          - Auth Requirements: Assumes RLS on underlying tables is handled.
          
          ## Performance Impact:
          - Indexes: Utilizes existing indexes on `orders`.
          - Triggers: None
          - Estimated Impact: "Positive. Significantly reduces data transfer and improves dashboard load time."
          */
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE(
    total_orders BIGINT,
    ready_for_par_count BIGINT,
    avg_days_in_stage DOUBLE PRECISION,
    regressions_7d BIGINT,
    total_history_7d BIGINT,
    archived_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH weekly_history AS (
        SELECT *
        FROM workflow_history
        WHERE changed_at >= now() - interval '7 days'
    ),
    active_orders AS (
        SELECT 
            o.id,
            o.last_stage_change,
            p.required_documents,
            o.document_status
        FROM orders o
        JOIN patients p ON o.patient_id = p.id
        WHERE o.is_archived = false
    )
    SELECT
        (SELECT count(*) FROM active_orders) AS total_orders,
        (SELECT count(*)
         FROM active_orders ao
         WHERE (
             SELECT count(*) = count(CASE WHEN (ao.document_status ->> key.value) = 'Complete' THEN 1 END)
             FROM jsonb_array_elements_text(ao.required_documents) as key
         )
        ) AS ready_for_par_count,
        (SELECT avg(EXTRACT(EPOCH FROM (now() - ao.last_stage_change)) / 86400) FROM active_orders ao) AS avg_days_in_stage,
        (SELECT count(*) FROM weekly_history wh WHERE is_backward(wh.previous_stage, wh.new_stage)) AS regressions_7d,
        (SELECT count(*) FROM weekly_history) AS total_history_7d,
        (SELECT count(*) FROM orders WHERE is_archived = true) AS archived_count;
END;
$$;
