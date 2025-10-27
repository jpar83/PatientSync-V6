/*
# [Function] get_account_overview
Recreates the account overview function to fix migration errors and improve security.

## Query Description:
This script first drops the existing `get_account_overview` function to prevent errors when its return signature changes. It then recreates the function with a secure search path. This function aggregates referral data to provide a high-level overview for each account (payer), including referral counts, compliance metrics, and a "hot list" of patients needing attention.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false (but the old function can be restored from previous migrations)

## Security Implications:
- RLS Status: The function uses `SECURITY DEFINER` to aggregate data across all referrals, potentially bypassing Row Level Security. This is necessary for a full overview but means the function should only be callable by authorized roles (e.g., `service_role` or specific admin roles).
- Policy Changes: No
- Auth Requirements: Access should be restricted via `GRANT` statements in your database.
- Search Path: Explicitly set to `public` to mitigate search path hijacking vulnerabilities.
*/
DROP FUNCTION IF EXISTS public.get_account_overview();

CREATE FUNCTION public.get_account_overview()
RETURNS TABLE (
    account_name text,
    total_referrals bigint,
    ready_for_par_count bigint,
    compliance_percentage numeric,
    hot_list jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH account_referrals AS (
        SELECT
            p.primary_insurance,
            o.id as order_id,
            p.id as patient_id,
            p.name as patient_name,
            p.required_documents,
            o.document_status
        FROM
            orders o
        JOIN
            patients p ON o.patient_id = p.id
        WHERE
            o.is_archived = false
            AND p.primary_insurance IS NOT NULL AND p.primary_insurance <> ''
    ),
    compliance_stats AS (
        SELECT
            ar.primary_insurance,
            ar.order_id,
            ar.patient_id,
            ar.patient_name,
            -- Count completed documents from the JSONB field
            (SELECT COUNT(*) FROM jsonb_each_text(ar.document_status) WHERE value = 'Complete') as completed_docs,
            array_length(ar.required_documents, 1) as total_required_docs
        FROM
            account_referrals ar
    ),
    account_stats AS (
        SELECT
            cs.primary_insurance as account_name,
            COUNT(cs.order_id) as total_referrals,
            SUM(CASE WHEN COALESCE(cs.total_required_docs, 0) > 0 AND cs.completed_docs >= cs.total_required_docs THEN 1 ELSE 0 END) as ready_for_par,
            AVG(
                CASE 
                    WHEN COALESCE(cs.total_required_docs, 0) > 0 THEN (cs.completed_docs::numeric / cs.total_required_docs) * 100
                    ELSE 100 -- If no docs are required, consider it 100% compliant
                END
            ) as avg_compliance
        FROM
            compliance_stats cs
        GROUP BY
            cs.primary_insurance
    ),
    hot_list_data AS (
         SELECT
            cs.primary_insurance,
            jsonb_agg(
                jsonb_build_object(
                    'patient_id', cs.patient_id,
                    'patient_name', cs.patient_name
                )
            ) FILTER (WHERE COALESCE(cs.total_required_docs, 0) > 0 AND cs.completed_docs < cs.total_required_docs) as hot_list_patients
        FROM
            compliance_stats cs
        GROUP BY
            cs.primary_insurance
    )
    SELECT
        ast.account_name,
        ast.total_referrals,
        ast.ready_for_par as ready_for_par_count,
        ROUND(COALESCE(ast.avg_compliance, 0), 2) as compliance_percentage,
        COALESCE(hld.hot_list_patients, '[]'::jsonb) as hot_list
    FROM
        account_stats ast
    LEFT JOIN
        hot_list_data hld ON ast.account_name = hld.primary_insurance;
END;
$$;
