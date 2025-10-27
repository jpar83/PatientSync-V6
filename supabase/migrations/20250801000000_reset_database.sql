/*
# [DANGEROUS] Full Data &amp; Function Reset
This script will permanently delete all transactional data and reset the core database functions to their latest correct versions.

## Query Description:
- **Data Deletion:** This operation will truncate the `patients`, `orders`, and all related log tables (`workflow_history`, `audit_log`, `vendor_log`). This action is IRREVERSIBLE and will result in complete data loss for these tables.
- **Function Reset:** It will drop and recreate the key database functions (`get_referrals_paginated`, `get_account_overview`, `get_dashboard_metrics`) to ensure they are up-to-date and free of errors.
- **Safety:** This script is designed for a clean start. It is highly recommended to back up your database before running this script if you have any data you wish to preserve.

## Metadata:
- Schema-Category: "Dangerous"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Tables Truncated: patients, orders, workflow_history, audit_log, vendor_log
- Functions Recreated: get_referrals_paginated, get_account_overview, get_dashboard_metrics

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Requires database owner or superuser privileges.

## Performance Impact:
- Indexes: Unchanged, but will be empty after truncate.
- Triggers: Unchanged.
- Estimated Impact: This will be a fast operation on the database, but the application will appear empty until new data is entered.
*/

-- Step 1: Truncate all transactional data
TRUNCATE
  public.patients,
  public.orders,
  public.workflow_history,
  public.audit_log,
  public.vendor_log
RESTART IDENTITY CASCADE;


-- Step 2: Recreate the get_referrals_paginated function for high-performance filtering
DROP FUNCTION IF EXISTS public.get_referrals_paginated(p_search_term text, p_stage_filters text[], p_account_filter text, p_limit integer, p_offset integer);
CREATE OR REPLACE FUNCTION public.get_referrals_paginated(
    p_search_term TEXT,
    p_stage_filters TEXT[],
    p_account_filter TEXT,
    p_limit INTEGER,
    p_offset INTEGER
)
RETURNS TABLE(
    id UUID,
    patient_id UUID,
    created_at TIMESTAMPTZ,
    workflow_stage TEXT,
    last_stage_change TIMESTAMPTZ,
    is_archived BOOLEAN,
    document_status JSONB,
    patients JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    SET search_path = public;
    RETURN QUERY
    SELECT
        o.id,
        o.patient_id,
        o.created_at,
        o.workflow_stage,
        o.last_stage_change,
        o.is_archived,
        o.document_status,
        json_build_object(
            'id', p.id,
            'name', p.name,
            'primary_insurance', p.primary_insurance,
            'required_documents', p.required_documents
        ) AS patients
    FROM
        orders o
    LEFT JOIN
        patients p ON o.patient_id = p.id
    WHERE
        o.is_archived = false
        AND (p_search_term IS NULL OR p.name ILIKE '%' || p_search_term || '%')
        AND (p_stage_filters IS NULL OR o.workflow_stage = ANY(p_stage_filters))
        AND (p_account_filter IS NULL OR p.primary_insurance = p_account_filter)
    ORDER BY
        p.name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Step 3: Recreate the get_account_overview function for the "My Accounts" page
DROP FUNCTION IF EXISTS public.get_account_overview();
CREATE OR REPLACE FUNCTION public.get_account_overview()
RETURNS TABLE(
    account_name TEXT,
    total_referrals BIGINT,
    ready_for_par_count BIGINT,
    compliance_percentage NUMERIC,
    hot_list JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    SET search_path = public;
    RETURN QUERY
    WITH account_referrals AS (
        SELECT
            COALESCE(p.primary_insurance, 'Uncategorized') AS account,
            p.id as patient_id,
            p.name as patient_name,
            p.required_documents,
            o.document_status
        FROM orders o
        JOIN patients p ON o.patient_id = p.id
        WHERE o.is_archived = false
    ),
    compliance_calcs AS (
        SELECT
            ar.account,
            ar.patient_id,
            ar.patient_name,
            (SELECT COUNT(*) FROM jsonb_object_keys(ar.document_status) doc WHERE ar.document_status->>doc = 'Complete') as completed_docs,
            COALESCE(array_length(ar.required_documents, 1), 0) as required_docs_count,
            (SELECT COUNT(*) > 0 FROM jsonb_object_keys(ar.document_status) doc WHERE ar.document_status->>doc = 'Missing') as has_missing_docs
        FROM account_referrals ar
    ),
    account_stats AS (
        SELECT
            cc.account,
            COUNT(*) as total_referrals,
            COUNT(*) FILTER (WHERE cc.required_docs_count > 0 AND cc.completed_docs >= cc.required_docs_count) as ready_for_par_count,
            CASE
                WHEN SUM(cc.required_docs_count) = 0 THEN 100
                ELSE ROUND((SUM(cc.completed_docs) * 100.0) / SUM(cc.required_docs_count))
            END as compliance_percentage
        FROM compliance_calcs cc
        GROUP BY cc.account
    ),
    ranked_hot_list AS (
        SELECT
            cc.account,
            cc.patient_id,
            cc.patient_name,
            ROW_NUMBER() OVER(PARTITION BY cc.account ORDER BY cc.has_missing_docs DESC, cc.patient_name) as rn
        FROM compliance_calcs cc
        WHERE cc.has_missing_docs = true
    )
    SELECT
        ast.account,
        ast.total_referrals,
        ast.ready_for_par_count,
        ast.compliance_percentage,
        (
            SELECT json_agg(json_build_object('patient_id', rhl.patient_id, 'patient_name', rhl.patient_name))
            FROM ranked_hot_list rhl
            WHERE rhl.account = ast.account AND rhl.rn <= 5
        ) as hot_list
    FROM account_stats ast;
END;
$$;

-- Step 4: Recreate the get_dashboard_metrics function for the Dashboard
DROP FUNCTION IF EXISTS public.get_dashboard_metrics();
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE(
    total_orders BIGINT,
    ready_for_par_count BIGINT,
    regressions_7d BIGINT,
    total_history_7d BIGINT,
    avg_days_in_stage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    SET search_path = public;
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.orders WHERE is_archived = false) as total_orders,
        (
            SELECT COUNT(*)
            FROM public.orders o
            JOIN public.patients p ON o.patient_id = p.id
            WHERE o.is_archived = false
              AND p.required_documents IS NOT NULL
              AND array_length(p.required_documents, 1) > 0
              AND (
                  SELECT COUNT(*)
                  FROM jsonb_object_keys(o.document_status) doc
                  WHERE o.document_status->>doc = 'Complete'
              ) >= array_length(p.required_documents, 1)
        ) as ready_for_par_count,
        (
            SELECT COUNT(*)
            FROM public.workflow_history
            WHERE changed_at >= now() - interval '7 days'
              AND is_backward(previous_stage, new_stage)
        ) as regressions_7d,
        (
            SELECT COUNT(*)
            FROM public.workflow_history
            WHERE changed_at >= now() - interval '7 days'
        ) as total_history_7d,
        (
            SELECT COALESCE(AVG(EXTRACT(DAY FROM (now() - last_stage_change))), 0)
            FROM public.orders
            WHERE is_archived = false AND last_stage_change IS NOT NULL
        )::NUMERIC(10, 1) as avg_days_in_stage;
END;
$$;
