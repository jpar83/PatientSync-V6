--
-- Name: get_dashboard_metrics(); Type: FUNCTION; Schema: public; Owner: postgres
--
/*
          # [Operation Name]
          Create/Replace `get_dashboard_metrics` function for performance optimization.

          ## Query Description: "This operation replaces the existing dashboard metrics function with a new, optimized version. It calculates all key dashboard metrics directly on the server, significantly reducing the amount of data sent to the client and improving dashboard load times. This change is non-destructive but essential for application performance."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function: `get_dashboard_metrics()`
          
          ## Security Implications:
          - RLS Status: Bypassed via SECURITY DEFINER
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: Utilizes existing indexes on `orders`.
          - Triggers: None
          - Estimated Impact: "High positive impact on dashboard load performance."
          */
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE(total_orders bigint, ready_for_par_count bigint, avg_days_in_stage double precision, regressions_7d bigint, total_history_7d bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH seven_days_ago AS (
    SELECT now() - interval '7 days' AS start_date
),
active_orders AS (
  SELECT 
    o.*,
    p.required_documents
  FROM orders o
  LEFT JOIN patients p ON o.patient_id = p.id
  WHERE o.is_archived IS DISTINCT FROM TRUE
),
history_7d AS (
    SELECT 
        *,
        (SELECT array_position(ARRAY['Referral Received', 'Patient Intake & Demographics', 'Insurance Verification', 'Clinical Review', 'ATP / PT Assessment', 'Documentation Verification', 'Preauthorization (PAR)', 'Vendor / Order Processing', 'Delivery & Billing', 'Post-Delivery Follow-up / Archive'], new_stage) > 
         array_position(ARRAY['Referral Received', 'Patient Intake & Demographics', 'Insurance Verification', 'Clinical Review', 'ATP / PT Assessment', 'Documentation Verification', 'Preauthorization (PAR)', 'Vendor / Order Processing', 'Delivery & Billing', 'Post-Delivery Follow-up / Archive'], previous_stage)) as is_forward
    FROM workflow_history
    WHERE changed_at >= (SELECT start_date FROM seven_days_ago)
)
SELECT
    (SELECT COUNT(*) FROM active_orders) AS total_orders,
    (SELECT COUNT(*) 
     FROM active_orders ao 
     WHERE ao.required_documents IS NOT NULL 
       AND array_length(ao.required_documents, 1) > 0
       AND (
         SELECT bool_and(ao.document_status ->> key = 'Complete') 
         FROM unnest(ao.required_documents) AS key
       )
    ) AS ready_for_par_count,
    (SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (now() - last_stage_change)) / 86400), 0) FROM active_orders) AS avg_days_in_stage,
    (SELECT COUNT(*) FROM history_7d WHERE is_forward = false) AS regressions_7d,
    (SELECT COUNT(*) FROM history_7d) AS total_history_7d
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO service_role;
