--
-- Name: get_dashboard_metrics(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

/*
          # [Operation Name]
          Fix and Secure get_dashboard_metrics Function

          ## Query Description: [This operation replaces the existing `get_dashboard_metrics` function with a more resilient and secure version. The new function uses a `LEFT JOIN` to prevent active referrals from being excluded from counts if their patient record is missing. It also correctly handles cases where `is_archived` is `NULL`, treating them as active. This ensures the dashboard KPIs are always accurate and complete. Additionally, it sets a fixed `search_path` to address security warnings.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Function `get_dashboard_metrics` will be dropped and recreated.
          
          ## Security Implications:
          - RLS Status: [N/A]
          - Policy Changes: [No]
          - Auth Requirements: [N/A]
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [N/A]
          - Estimated Impact: [Low. The query is optimized to run efficiently on the server.]
          */

-- Drop the old function to avoid conflicts with return type changes.
DROP FUNCTION IF EXISTS public.get_dashboard_metrics();

-- Create the new, corrected function.
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE (
    total_orders bigint,
    ready_for_par_count bigint,
    avg_days_in_stage integer,
    regressions_7d bigint,
    total_history_7d bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH active_orders AS (
  SELECT
    o.id,
    o.last_stage_change,
    o.document_status,
    p.required_documents
  FROM
    orders o
  LEFT JOIN
    patients p ON o.patient_id = p.id
  WHERE
    COALESCE(o.is_archived, false) = false
),
ready_for_par AS (
  SELECT
    COUNT(*) as ready_for_par_count
  FROM
    active_orders ao
  WHERE
    (
      SELECT
        -- This checks if all required documents have a status of 'Complete'
        bool_and(ao.document_status->>key = 'Complete')
      FROM
        -- Unnest the required_documents array
        jsonb_array_elements_text(COALESCE(ao.required_documents::jsonb, '[]'::jsonb)) as key
    ) = true
    -- Ensure we only count orders that actually have required documents
    AND jsonb_array_length(COALESCE(ao.required_documents::jsonb, '[]'::jsonb)) > 0
),
recent_history AS (
    SELECT
        wh.previous_stage,
        wh.new_stage
    FROM
        workflow_history wh
    WHERE
        wh.changed_at >= now() - interval '7 days'
)
SELECT
    (SELECT COUNT(*) FROM active_orders) AS total_orders,
    (SELECT ready_for_par_count FROM ready_for_par) AS ready_for_par_count,
    COALESCE(
        (SELECT avg(EXTRACT(DAY FROM now() - ao.last_stage_change)) FROM active_orders ao WHERE ao.last_stage_change IS NOT NULL),
        0
    )::integer AS avg_days_in_stage,
    (SELECT COUNT(*) FROM recent_history rh WHERE is_backward(rh.previous_stage, rh.new_stage)) AS regressions_7d,
    (SELECT COUNT(*) FROM recent_history) AS total_history_7d;
$$;
