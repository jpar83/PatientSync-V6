/*
  # [Function] Create get_denial_analytics
  [This function calculates denial rates per payer and the average time to resolve denials.]
  ## Query Description: [This function aggregates data from the 'denials', 'orders', and 'patients' tables to provide key performance indicators for the reports page. It calculates the total number of referrals, the number of denials, and the average resolution time for each insurance provider. This is a read-only operation and does not pose a risk to existing data.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function: public.get_denial_analytics()
  ## Security Implications:
  - RLS Status: N/A (SECURITY DEFINER function)
  - Policy Changes: No
  - Auth Requirements: Assumes authenticated user context.
  ## Performance Impact:
  - Indexes: Benefits from indexes on foreign keys (order_id, patient_id) and dates.
  - Triggers: N/A
  - Estimated Impact: Medium query load during report generation.
*/
CREATE OR REPLACE FUNCTION public.get_denial_analytics()
RETURNS TABLE(
    payer_name text,
    total_referrals bigint,
    total_denials bigint,
    denial_rate numeric,
    avg_resolution_days numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH referral_counts AS (
        SELECT
            p.primary_insurance,
            count(o.id) as referral_count
        FROM orders o
        JOIN patients p ON o.patient_id = p.id
        WHERE p.primary_insurance IS NOT NULL
        GROUP BY p.primary_insurance
    ),
    denial_stats AS (
        SELECT
            p.primary_insurance,
            count(d.id) as denial_count,
            avg(
                CASE
                    WHEN d.appeal_outcome IN ('Approved', 'Denied Again', 'Withdrawn') AND d.appeal_date IS NOT NULL THEN
                        d.appeal_date - d.denial_date
                    ELSE NULL
                END
            )::numeric AS avg_res_days
        FROM denials d
        JOIN orders o ON d.order_id = o.id
        JOIN patients p ON o.patient_id = p.id
        WHERE p.primary_insurance IS NOT NULL
        GROUP BY p.primary_insurance
    )
    SELECT
        rc.primary_insurance AS payer_name,
        rc.referral_count AS total_referrals,
        COALESCE(ds.denial_count, 0) AS total_denials,
        (COALESCE(ds.denial_count, 0)::numeric / rc.referral_count * 100)::numeric(5,2) AS denial_rate,
        COALESCE(ds.avg_res_days, 0)::numeric(10,2) AS avg_resolution_days
    FROM referral_counts rc
    LEFT JOIN denial_stats ds ON rc.primary_insurance = ds.primary_insurance;
END;
$$;
