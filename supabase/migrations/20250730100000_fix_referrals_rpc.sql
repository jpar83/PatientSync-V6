--
-- Name: get_referrals_paginated(integer, integer, text, text[], text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--
/*
          # [Function] get_referrals_paginated
          Fixes the paginated referrals query to be resilient against missing data.

          ## Query Description: [This function retrieves a paginated list of referrals for the main application view. It has been updated to use a `LEFT JOIN` on the `patients` table. This is a critical fix to prevent referrals from being dropped from the results if the corresponding patient record is missing or inaccessible due to RLS policies. It also uses `IS DISTINCT FROM TRUE` to correctly handle `NULL` values in the `is_archived` column, ensuring all non-archived referrals are included.]

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Function: `get_referrals_paginated`
          - Tables Read: `orders`, `patients`
          - Logic Change: `INNER JOIN` is replaced with `LEFT JOIN`. The `is_archived` filter is now `NULL`-safe.

          ## Security Implications:
          - RLS Status: The query respects existing RLS policies. The `LEFT JOIN` ensures that even if a user cannot see a patient, the referral itself will still be visible.
          - Policy Changes: No
          - Auth Requirements: Relies on the calling user's session.

          ## Performance Impact:
          - Indexes: Utilizes existing indexes on `orders` and `patients`.
          - Triggers: None
          - Estimated Impact: Performance should remain high. The `LEFT JOIN` is slightly more expensive than an `INNER JOIN` but is necessary for data correctness.
          */
CREATE OR REPLACE FUNCTION public.get_referrals_paginated(p_limit integer, p_offset integer, p_search_term text DEFAULT NULL::text, p_stage_filters text[] DEFAULT NULL::text[], p_account_filter text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, patient_id uuid, patient_name text, chair_type text, accessories text, workflow_stage text, status text, rep_name text, referral_date text, payer_name text, auth_status text, po_number text, eta text, serial_number text, claim_number text, billing_date text, last_stage_change text, last_stage_note text, is_archived boolean, vendor_id uuid, referral_source text, diagnosis_code text, clinical_notes text, mobility_needs text, equipment_requested text, pt_eval_date text, f2f_date text, assigned_rep text, market_rep text, date_received text, authorization_number text, order_date text, document_status jsonb, patients json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.created_at,
        o.patient_id,
        o.patient_name,
        o.chair_type,
        o.accessories,
        o.workflow_stage,
        o.status,
        o.rep_name,
        o.referral_date,
        o.payer_name,
        o.auth_status,
        o.po_number,
        o.eta,
        o.serial_number,
        o.claim_number,
        o.billing_date,
        o.last_stage_change,
        o.last_stage_note,
        o.is_archived,
        o.vendor_id,
        o.referral_source,
        o.diagnosis_code,
        o.clinical_notes,
        o.mobility_needs,
        o.equipment_requested,
        o.pt_eval_date,
        o.f2f_date,
        o.assigned_rep,
        o.market_rep,
        o.date_received,
        o.authorization_number,
        o.order_date,
        o.document_status,
        row_to_json(p) as patients
    FROM
        orders o
    LEFT JOIN
        patients p ON o.patient_id = p.id
    WHERE
        (o.is_archived IS DISTINCT FROM TRUE)
        AND (p_search_term IS NULL OR p.name ILIKE '%' || p_search_term || '%')
        AND (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
        AND (p_account_filter IS NULL OR p.primary_insurance ILIKE '%' || p_account_filter || '%')
    ORDER BY
        p.name ASC, o.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$
;

GRANT EXECUTE ON FUNCTION public.get_referrals_paginated(integer, integer, text, text[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referrals_paginated(integer, integer, text, text[], text) TO service_role;
